"""MCP server that lets an AI assistant read CVH workspaces, datasets and visualizations.

Run with `cvh-mcp` (stdio transport) after installing the `mcp` extra:

    claude mcp add cvh -- uvx --from "cvh-client[mcp]" cvh-mcp

Sign-in uses the same Auth0 device flow as `CVHClient.from_login`, but never
blocks a tool call or prints to stdout (stdout carries the MCP protocol): the
first tool that needs a login starts the flow, opens the browser, and returns
the URL and code for the user, while a background thread waits for the token.
The token is kept in memory only, so each server start signs in again.
"""

from __future__ import annotations

import os
import threading
import webbrowser
from collections.abc import Callable
from typing import Any, Literal

from pydantic import BaseModel

from cvh_client.auth import (
    DeviceAuthorizationError,
    is_token_expired,
    poll_for_token,
    request_device_code,
)
from cvh_client.client import CVHClient
from cvh_client.exceptions import CVHError

try:
    from mcp.server.mcpserver import MCPServer
    from mcp.server.mcpserver.exceptions import ToolError
    from mcp_types import ToolAnnotations
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        'The CVH MCP server needs the mcp extra: pip install "cvh-client[mcp]"'
    ) from exc

API_URL = os.environ.get("CVH_API_URL", "https://api.visualizationhub.org")
AUTH0_DOMAIN = os.environ.get("CVH_AUTH0_DOMAIN", "auth.visualizationhub.org")
AUTH0_CLIENT_ID = os.environ.get(
    "CVH_AUTH0_CLIENT_ID", "FKDEMc1rao9wVRnMIE9RznPsiLeHRXJS"
)
AUTH0_AUDIENCE = os.environ.get("CVH_AUTH0_AUDIENCE", "cvh-api-prod-id")

READ_ONLY = ToolAnnotations(readOnlyHint=True, openWorldHint=False)

server = MCPServer(
    name="cvh",
    instructions=(
        "Read-only access to the Community Visualization Hub (CVH): the user's "
        "workspaces, the genomic datasets in them, and Gosling or Vitessce "
        "visualizations. Published visualizations can be read without signing in."
    ),
)

_lock = threading.Lock()
_token: str | None = None
_pending: dict | None = None  # Auth0 device-code response while the user signs in


def _wait_for_login(device: dict) -> None:
    global _token, _pending
    try:
        token_data = poll_for_token(
            domain=AUTH0_DOMAIN,
            client_id=AUTH0_CLIENT_ID,
            device_code=device["device_code"],
            interval=device.get("interval", 5),
            expires_in=device.get("expires_in", 900),
        )
        with _lock:
            _token = token_data["access_token"]
    except DeviceAuthorizationError:
        pass  # denied or expired: the next tool call starts a fresh flow
    finally:
        with _lock:
            if _pending is device:
                _pending = None


def _signed_in_client() -> CVHClient:
    """Return a client for the signed-in user, or start sign-in and raise ToolError."""
    global _pending
    with _lock:
        if _token and not is_token_expired(_token):
            return CVHClient(base_url=API_URL, token=_token)
        if _pending is None:
            _pending = request_device_code(
                domain=AUTH0_DOMAIN,
                client_id=AUTH0_CLIENT_ID,
                audience=AUTH0_AUDIENCE,
            )
            threading.Thread(
                target=_wait_for_login, args=(_pending,), daemon=True
            ).start()
            webbrowser.open(
                _pending.get("verification_uri_complete")
                or _pending["verification_uri"]
            )
        url, code = _pending["verification_uri"], _pending["user_code"]
    raise ToolError(
        f"Not signed in to CVH. Ask the user to open {url} (CVH's own Auth0 "
        f"sign-in page; a browser tab may already be open), confirm the code "
        f"{code}, and tell you when they're done; then call this tool again."
    )


# The API sets last_viewed_timestamp at creation and never updates it, so it would
# mislead the model. Only top-level fields and paged `items` are filtered, never `conf`.
HIDDEN_FIELDS = frozenset({"last_viewed_timestamp"})


def _without(data: dict, hidden: frozenset[str]) -> dict:
    return {key: value for key, value in data.items() if key not in hidden}


def _dump(result: Any, hidden: frozenset[str]) -> Any:
    if isinstance(result, list):
        return [_dump(item, hidden) for item in result]
    if not isinstance(result, BaseModel):
        return result
    data = _without(result.model_dump(mode="json"), hidden)
    if isinstance(data.get("items"), list):
        data["items"] = [_without(item, hidden) for item in data["items"]]
    return data


def _call(
    fn: Callable[[CVHClient], Any],
    *,
    signed_in: bool = True,
    hidden: frozenset[str] = HIDDEN_FIELDS,
) -> Any:
    client = _signed_in_client() if signed_in else CVHClient(base_url=API_URL)
    try:
        with client:
            return _dump(fn(client), hidden)
    except CVHError as exc:
        # Surface the API's message (404, 403, ...) to the model instead of a generic failure.
        raise ToolError(str(exc)) from exc


@server.tool(annotations=READ_ONLY)
def list_workspaces(limit: int = 100, offset: int = 0) -> dict:
    """List the CVH workspaces the signed-in user can access, with dataset and visualization counts.

    Doesn't include the user's permission level; call get_workspace for that.
    """
    # The list endpoint never fills `permissions`, so it would always read null.
    return _call(
        lambda c: c.list_workspaces(limit=limit, offset=offset),
        hidden=HIDDEN_FIELDS | {"permissions"},
    )


@server.tool(annotations=READ_ONLY)
def get_workspace(workspace_uuid: str) -> dict:
    """Get one workspace by UUID, including the user's permission level (1 read, 2 write, 3 admin)."""
    return _call(lambda c: c.get_workspace(workspace_uuid))


@server.tool(annotations=READ_ONLY)
def list_datasets(
    workspace_uuid: str,
    assembly: list[str] | None = None,
    file_type: list[str] | None = None,
    name: str | None = None,
    tool: Literal["gosling", "vitessce"] | None = None,
    page: int = 1,
    page_size: int | None = None,
) -> dict:
    """List datasets in a workspace.

    Filters combine with AND; values inside one list combine with OR. `assembly`
    is a genome assembly such as "hg38"; `file_type` is one of bigwig, vector,
    cooler, multivec, bam, vcf, bed, gff, beddb, csv; `name` is a
    case-insensitive substring.
    """
    return _call(
        lambda c: c.list_datasets(
            workspace_uuid,
            assembly=assembly,
            file_type=file_type,
            name=name,
            tool=tool,
            page=page,
            page_size=page_size,
        )
    )


@server.tool(annotations=READ_ONLY)
def get_dataset(dataset_uuid: str) -> dict:
    """Get one dataset by UUID, including its source URL, file type and assembly."""
    return _call(lambda c: c.get_dataset(dataset_uuid))


@server.tool(annotations=READ_ONLY)
def list_visualizations(workspace_uuid: str, name: str | None = None) -> list[dict]:
    """List visualizations in a workspace (without their configs; use get_visualization for one)."""
    return _call(lambda c: c.list_visualizations(workspace_uuid, name=name))


@server.tool(annotations=READ_ONLY)
def get_visualization(visualization_uuid: str) -> dict:
    """Get one visualization by UUID, including its full Gosling spec or Vitessce config (`conf`)."""
    return _call(lambda c: c.get_visualization(visualization_uuid))


@server.tool(annotations=READ_ONLY)
def search_public_visualizations(
    tags: list[str] | None = None, limit: int = 100, offset: int = 0
) -> dict:
    """List published visualizations, newest first. No sign-in needed.

    `tags` are tag labels (text), not UUIDs.
    """
    return _call(
        lambda c: c.list_public_visualizations(tags=tags, limit=limit, offset=offset),
        signed_in=False,
    )


@server.tool(annotations=READ_ONLY)
def get_public_visualization(visualization_uuid: str) -> dict:
    """Get a published visualization, including its config. No sign-in needed."""
    return _call(
        lambda c: c.get_public_visualization(visualization_uuid), signed_in=False
    )


def main() -> None:
    server.run()


if __name__ == "__main__":
    main()
