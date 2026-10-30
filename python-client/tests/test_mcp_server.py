import json
import stat
from unittest.mock import MagicMock, patch

import httpx
import pytest

pytest.importorskip("mcp")

from mcp.server.mcpserver.exceptions import ToolError

from cvh_client import mcp_server
from cvh_client.client import CVHClient
from cvh_client.exceptions import AuthorizationError, NotFoundError
from cvh_client.models import (
    Dataset,
    PagedVisualizations,
    PagedWorkspaces,
    Visualization,
    VisualizationSummary,
    Workspace,
)

from .test_client import DATASET_DATA, VISUALIZATION_DATA, WORKSPACE_DATA, _make_jwt

DEVICE = {
    "device_code": "dev-code",
    "user_code": "ABCD-EFGH",
    "verification_uri": "https://auth.example.org/activate",
    "verification_uri_complete": "https://auth.example.org/activate?user_code=ABCD-EFGH",
    "expires_in": 900,
    "interval": 5,
}


@pytest.fixture(autouse=True)
def signed_out(tmp_path):
    mcp_server._token = None
    mcp_server._pending = None
    # Never read or write the real token cache.
    with (
        patch.object(mcp_server, "TOKEN_PATH", tmp_path / "cvh-client" / "token.json"),
        patch.object(mcp_server.webbrowser, "open"),
    ):
        yield
    mcp_server._token = None
    mcp_server._pending = None


WRITE_TOOLS = {
    "create_visualization",
    "update_visualization",
    "publish_visualization",
    "unpublish_visualization",
    "set_visualization_tags",
    "add_dataset",
    "add_cfdb_dataset",
    "set_dataset_tags",
    "start_dataset_processing",
    "check_dataset_processing",
}


async def test_only_write_tools_can_change_data():
    tools = {t.name: t.annotations for t in await mcp_server.server.list_tools()}
    assert len(tools) == 22
    for name, annotations in tools.items():
        assert annotations.read_only_hint is (name not in WRITE_TOOLS), name
    # Overwriting a config is destructive, so clients should ask first.
    assert tools["update_visualization"].destructive_hint is True
    assert tools["publish_visualization"].destructive_hint is True


def test_signed_out_call_starts_one_device_flow_and_returns_the_code():
    with (
        patch.object(
            mcp_server, "request_device_code", return_value=dict(DEVICE)
        ) as request,
        patch.object(mcp_server.threading, "Thread") as thread,
    ):
        for _ in range(2):
            with pytest.raises(ToolError, match="ABCD-EFGH"):
                mcp_server.list_workspaces()

    # A second call while the user is still signing in reuses the pending flow.
    request.assert_called_once()
    thread.return_value.start.assert_called_once()


def test_finished_login_lets_tools_through():
    token = _make_jwt({"exp": 9999999999})
    with patch.object(
        mcp_server, "poll_for_token", return_value={"access_token": token}
    ):
        mcp_server._pending = dict(DEVICE)
        mcp_server._wait_for_login(mcp_server._pending)
    assert mcp_server._token == token
    assert mcp_server._pending is None

    with patch.object(
        CVHClient,
        "list_workspaces",
        return_value=PagedWorkspaces(items=[WORKSPACE_DATA], count=1),
    ):
        result = mcp_server.list_workspaces()
    assert result["count"] == 1
    assert result["items"][0]["uuid"] == WORKSPACE_DATA["uuid"]
    # Fields the list endpoint leaves null or never updates are hidden from the model.
    assert "permissions" not in result["items"][0]
    assert "last_viewed_timestamp" not in result["items"][0]


def test_get_workspace_keeps_permissions_but_hides_last_viewed():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    with patch.object(
        CVHClient, "get_workspace", return_value=Workspace(**WORKSPACE_DATA)
    ):
        result = mcp_server.get_workspace("ws-uuid-1")
    assert result["permissions"] == 1
    assert "last_viewed_timestamp" not in result


def test_failed_login_lets_the_next_call_start_over():
    with patch.object(
        mcp_server,
        "poll_for_token",
        side_effect=mcp_server.DeviceAuthorizationError("denied"),
    ):
        mcp_server._pending = dict(DEVICE)
        mcp_server._wait_for_login(mcp_server._pending)
    assert mcp_server._token is None
    assert mcp_server._pending is None


def test_api_errors_reach_the_model_as_tool_errors():
    response = httpx.Response(
        404, request=httpx.Request("GET", "https://api.example.org/x")
    )
    with (
        patch.object(
            CVHClient, "get_public_visualization", side_effect=NotFoundError(response)
        ),
        pytest.raises(ToolError, match="doesn.t have access.*404"),
    ):
        mcp_server.get_public_visualization("missing")


def test_public_tools_never_start_sign_in():
    request = MagicMock()
    with (
        patch.object(mcp_server, "request_device_code", request),
        patch.object(
            CVHClient,
            "list_public_visualizations",
            return_value=PagedVisualizations(items=[], count=0),
        ),
    ):
        mcp_server.search_public_visualizations()
    request.assert_not_called()


def _api_error(cls, status):
    response = httpx.Response(
        status, request=httpx.Request("GET", "https://api.example.org/x")
    )
    return cls(response)


def test_login_is_saved_owner_only_and_reused_after_restart():
    token = _make_jwt({"exp": 9999999999})
    with patch.object(
        mcp_server, "poll_for_token", return_value={"access_token": token}
    ):
        mcp_server._pending = dict(DEVICE)
        mcp_server._wait_for_login(mcp_server._pending)

    mode = stat.S_IMODE(mcp_server.TOKEN_PATH.stat().st_mode)
    assert mode == 0o600

    mcp_server._token = None  # a fresh server process
    request = MagicMock()
    with (
        patch.object(mcp_server, "request_device_code", request),
        patch.object(
            CVHClient, "get_workspace", return_value=Workspace(**WORKSPACE_DATA)
        ),
    ):
        mcp_server.get_workspace("ws-uuid-1")
    request.assert_not_called()


def test_token_saved_for_another_deployment_is_ignored():
    mcp_server.TOKEN_PATH.parent.mkdir(parents=True)
    mcp_server.TOKEN_PATH.write_text(
        json.dumps(
            {
                "owner": {**mcp_server._token_owner(), "audience": "cvh-api-dev"},
                "access_token": _make_jwt({"exp": 9999999999}),
            }
        )
    )
    assert mcp_server._load_token() is None


def test_rejected_token_is_forgotten():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    mcp_server._save_token(mcp_server._token)
    with (
        patch.object(
            CVHClient,
            "get_workspace",
            side_effect=_api_error(AuthorizationError, 401),
        ),
        pytest.raises(ToolError),
    ):
        mcp_server.get_workspace("ws-uuid-1")
    assert mcp_server._token is None
    assert not mcp_server.TOKEN_PATH.exists()


def test_forbidden_keeps_the_token():
    # 403 means no access to that workspace, not a bad sign-in.
    mcp_server._token = _make_jwt({"exp": 9999999999})
    with (
        patch.object(
            CVHClient,
            "get_workspace",
            side_effect=_api_error(AuthorizationError, 403),
        ),
        pytest.raises(ToolError),
    ):
        mcp_server.get_workspace("ws-uuid-1")
    assert mcp_server._token is not None


def test_list_visualizations_matches_the_other_list_tools():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    summary = VisualizationSummary.model_validate(VISUALIZATION_DATA)
    with patch.object(CVHClient, "list_visualizations", return_value=[summary]):
        result = mcp_server.list_visualizations("ws-uuid-1")
    assert result["count"] == 1
    assert result["items"][0]["uuid"] == VISUALIZATION_DATA["uuid"]


def _cfdb_response(data=None, errors=None):
    body = {"data": data}
    if errors:
        body["errors"] = errors
    return httpx.Response(
        200, json=body, request=httpx.Request("POST", "https://cfdb.example.org")
    )


def test_cfdb_filters_become_nested_input_and_pages_are_capped():
    data = {"files": {"totalCount": 1, "items": [{"localId": "f1"}]}}
    with patch.object(
        mcp_server.httpx, "post", return_value=_cfdb_response(data)
    ) as post:
        result = mcp_server.search_cfdb_files(
            dcc=["ENCODE"], file_format=["bigWig"], page=-1, page_size=10_000
        )

    variables = post.call_args.kwargs["json"]["variables"]
    assert variables["input"] == [
        {"dcc": [{"dccAbbreviation": ["ENCODE"]}], "fileFormat": [{"name": ["bigWig"]}]}
    ]
    assert variables["page"] == 0
    assert variables["pageSize"] == 500
    assert result == {"count": 1, "items": [{"localId": "f1"}]}


def test_cfdb_field_values_use_friendly_names():
    data = {"distinctValues": [{"field": "dcc.dcc_abbreviation", "values": ["ENCODE"]}]}
    with patch.object(
        mcp_server.httpx, "post", return_value=_cfdb_response(data)
    ) as post:
        result = mcp_server.cfdb_field_values(["dcc", "assay_type"])

    sent = post.call_args.kwargs["json"]["variables"]
    assert sent["fields"] == ["dcc.dcc_abbreviation", "assay_type.name"]
    assert sent["input"] is None
    assert result == {"dcc": ["ENCODE"], "assay_type": []}


def test_cfdb_errors_reach_the_model():
    with (
        patch.object(
            mcp_server.httpx,
            "post",
            return_value=_cfdb_response(errors=[{"message": "pageSize too large"}]),
        ),
        pytest.raises(ToolError, match="pageSize too large"),
    ):
        mcp_server.count_cfdb_files()


def test_missing_cfdb_file_is_a_clear_error():
    with (
        patch.object(
            mcp_server.httpx,
            "post",
            return_value=_cfdb_response({"files": {"items": []}}),
        ),
        pytest.raises(ToolError, match="No cfdb file"),
    ):
        mcp_server.get_cfdb_file("ENCODE", "missing")


def test_count_cfdb_files_groups_by_field_and_counts_files_without_a_value():
    def fake_post(url, json, timeout):
        variables = json["variables"]
        if "distinctValues" in json["query"]:
            return _cfdb_response(
                {"distinctValues": [{"field": "assay_type.name", "values": ["A", "B"]}]}
            )
        assay = (variables["input"] or [{}])[0].get("assayType")
        count = {None: 10, "A": 6, "B": 3}[assay[0]["name"][0] if assay else None]
        return _cfdb_response({"fileCount": count})

    with patch.object(mcp_server.httpx, "post", side_effect=fake_post):
        result = mcp_server.count_cfdb_files(dcc=["ENCODE"], group_by="assay_type")

    assert result == {"count": 10, "groups": {"A": 6, "B": 3}, "no_value": 1}


VALID_SPEC = {
    "tracks": [
        {
            "data": {"url": "https://example.org/a.bw", "type": "bigwig"},
            "mark": "bar",
            "x": {"field": "position", "type": "genomic"},
            "width": 600,
            "height": 100,
        }
    ]
}


def test_gosling_errors_name_the_real_problem():
    spec = {"tracks": [{**VALID_SPEC["tracks"][0], "mark": "bars"}]}
    errors = mcp_server._gosling_errors(spec)
    assert errors[0].startswith("$.tracks[0].mark: 'bars' is not one of")
    assert mcp_server._gosling_errors(VALID_SPEC) == []


def test_gosling_counts_match_the_frontend():
    track = VALID_SPEC["tracks"][0]
    spec = {
        "views": [
            {"tracks": [track, {**track, "data": {"url": "b", "type": "csv"}}]},
            {
                "tracks": [
                    {"alignment": "overlay", "tracks": [track, track]},
                    {"type": "dummy-track"},
                ]
            },
        ]
    }
    # The overlay counts once, its layers and the dummy track not at all.
    assert mcp_server._gosling_counts(spec) == {"n_tracks": 3, "n_datasets": 2}


def test_invalid_spec_creates_nothing():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    bad = {"tracks": [{**VALID_SPEC["tracks"][0], "mark": "bars"}]}
    with (
        patch.object(CVHClient, "create_visualization") as create,
        pytest.raises(ToolError, match="mark"),
    ):
        mcp_server.create_visualization("ws-uuid-1", "Bad", conf=bad)
    create.assert_not_called()


def test_create_with_spec_saves_config_and_counts():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    created = Visualization.model_validate({**VISUALIZATION_DATA, "conf": None})
    with (
        patch.object(CVHClient, "create_visualization", return_value=created),
        patch.object(CVHClient, "update_visualization", return_value={}) as update,
    ):
        result = mcp_server.create_visualization("ws-uuid-1", "New", conf=VALID_SPEC)
    update.assert_called_once_with(
        created.uuid, conf=VALID_SPEC, n_tracks=1, n_datasets=1
    )
    assert result["conf"] == VALID_SPEC


def test_update_validates_gosling_but_not_vitessce():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    bad = {"tracks": "not a list"}
    for tool, should_save in (("gosling", False), ("vitessce", True)):
        existing = Visualization.model_validate({**VISUALIZATION_DATA, "tool": tool})
        with (
            patch.object(CVHClient, "get_visualization", return_value=existing),
            patch.object(CVHClient, "update_visualization", return_value={}) as update,
        ):
            if should_save:
                mcp_server.update_visualization("viz-uuid-1", conf=bad)
            else:
                with pytest.raises(ToolError, match="invalid"):
                    mcp_server.update_visualization("viz-uuid-1", conf=bad)
        assert update.called is should_save, tool


def test_update_without_changes_is_an_error():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    with pytest.raises(ToolError, match="Nothing to update"):
        mcp_server.update_visualization("viz-uuid-1")


def _cfdb_file(format_id, format_name):
    return _cfdb_response(
        {
            "files": {
                "items": [
                    {
                        "localId": "4DNFI1",
                        "filename": "reads.sam",
                        "genomeAssembly": "GRCh38",
                        "fileFormat": {"id": format_id, "name": format_name},
                    }
                ]
            }
        }
    )


def test_add_cfdb_dataset_matches_browse_library():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    cases = (
        # Ready to draw: CVH links straight to cfdb's /data URL.
        (
            "format:3006",
            "bigwig",
            {"source_url": f"{mcp_server.CFDB_URL}/data/4dn/4DNFI1"},
            "not_needed",
        ),
        # Needs processing: the backend builds the URLs from the ids.
        ("format:2573", "bam", {"cfdb_dcc": "4dn", "cfdb_id": "4DNFI1"}, "needed"),
    )
    for format_id, file_type, fields, processing in cases:
        dataset = Dataset.model_validate(
            {**DATASET_DATA, "processing_status": processing}
        )
        with (
            patch.object(
                mcp_server.httpx, "post", return_value=_cfdb_file(format_id, "x")
            ),
            patch.object(CVHClient, "create_dataset", return_value=dataset) as create,
            patch.object(CVHClient, "post") as start,
        ):
            result = mcp_server.add_cfdb_dataset("ws-uuid-1", "4DN_DCIC", "4DNFI1")
        # Processing waits for the user's go-ahead.
        start.assert_not_called()
        assert result["processing_status"] == processing
        create.assert_called_once_with(
            "ws-uuid-1",
            "reads.sam",
            file_type,
            data_type=file_type,
            assembly="GRCh38",
            **fields,
        )


def test_add_cfdb_dataset_refuses_unsupported_formats():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    with (
        patch.object(
            mcp_server.httpx, "post", return_value=_cfdb_file("format:3475", "TSV")
        ),
        patch.object(CVHClient, "create_dataset") as create,
        pytest.raises(ToolError, match="TSV"),
    ):
        mcp_server.add_cfdb_dataset("ws-uuid-1", "4DN_DCIC", "4DNFI1")
    create.assert_not_called()


def test_check_processing_records_a_finished_job_like_the_data_panel():
    mcp_server._token = _make_jwt({"exp": 9999999999})
    running = Dataset.model_validate(
        {**DATASET_DATA, "processing_status": "started", "processing_job_id": "job-1"}
    )
    for job, reported in (
        ({"status": "running", "progress": 0.4}, None),
        ({"status": "completed"}, {"status": "processed", "error": None}),
        (
            {"status": "failed", "error": "bad file"},
            {"status": "failed", "error": "bad file"},
        ),
    ):
        response = httpx.Response(
            200, json=job, request=httpx.Request("GET", "https://cfdb.example.org")
        )
        with (
            patch.object(CVHClient, "get_dataset", return_value=running),
            patch.object(mcp_server.httpx, "get", return_value=response) as get,
            patch.object(
                CVHClient, "put", return_value={"processing_status": "x"}
            ) as put,
        ):
            result = mcp_server.check_dataset_processing("ds-uuid-1")
        assert get.call_args.args[0].endswith("/jobs/job-1")
        if reported is None:
            put.assert_not_called()
            assert result["job"] == job
        else:
            put.assert_called_once_with(
                "/api/datasets/ds-uuid-1/processing-status", json=reported
            )
