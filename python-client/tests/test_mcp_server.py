from unittest.mock import MagicMock, patch

import httpx
import pytest

pytest.importorskip("mcp")

from mcp.server.mcpserver.exceptions import ToolError

from cvh_client import mcp_server
from cvh_client.client import CVHClient
from cvh_client.exceptions import NotFoundError
from cvh_client.models import PagedVisualizations, PagedWorkspaces, Workspace

from .test_client import WORKSPACE_DATA, _make_jwt

DEVICE = {
    "device_code": "dev-code",
    "user_code": "ABCD-EFGH",
    "verification_uri": "https://auth.example.org/activate",
    "verification_uri_complete": "https://auth.example.org/activate?user_code=ABCD-EFGH",
    "expires_in": 900,
    "interval": 5,
}


@pytest.fixture(autouse=True)
def signed_out():
    mcp_server._token = None
    mcp_server._pending = None
    with patch.object(mcp_server.webbrowser, "open"):
        yield
    mcp_server._token = None
    mcp_server._pending = None


async def test_every_tool_is_read_only():
    tools = await mcp_server.server.list_tools()
    assert len(tools) == 8
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
        pytest.raises(ToolError, match="404"),
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
