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
    PagedVisualizations,
    PagedWorkspaces,
    VisualizationSummary,
    Workspace,
)

from .test_client import VISUALIZATION_DATA, WORKSPACE_DATA, _make_jwt

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


async def test_every_tool_is_read_only():
    tools = await mcp_server.server.list_tools()
    assert len(tools) == 12
    assert all(t.annotations.read_only_hint for t in tools)


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
