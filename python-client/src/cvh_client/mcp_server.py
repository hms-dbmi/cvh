"""MCP server that lets an AI assistant read CVH workspaces, datasets and visualizations,
create and edit visualizations, and search CFDE file metadata in cfdb.

Run with `cvh-mcp` (stdio transport) after installing the `mcp` extra:

    claude mcp add cvh -- uvx --from "cvh-client[mcp]" cvh-mcp

Sign-in uses the same Auth0 device flow as `CVHClient.from_login`, but never
blocks a tool call or prints to stdout (stdout carries the MCP protocol): the
first tool that needs a login starts the flow, opens the browser, and returns
the URL and code for the user, while a background thread waits for the token.
The token is saved to a file only the user can read (`TOKEN_PATH`) and reused
across restarts until it expires or the API rejects it.
"""

from __future__ import annotations

import functools
import json
import os
import threading
import webbrowser
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Literal

import httpx
from pydantic import BaseModel

from cvh_client.auth import (
    DeviceAuthorizationError,
    is_token_expired,
    poll_for_token,
    request_device_code,
)
from cvh_client.client import CVHClient
from cvh_client.exceptions import AuthorizationError, CVHError, NotFoundError

try:
    from jsonschema import Draft7Validator
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
# Same default as the CVH backend's CFDB_BASE_URL.
CFDB_URL = os.environ.get("CVH_CFDB_URL", "https://dev.cfdb.vis-api.link")
TOKEN_PATH = (
    Path(os.environ.get("XDG_CACHE_HOME") or Path.home() / ".cache")
    / "cvh-client"
    / "mcp-token.json"
)

READ_ONLY = ToolAnnotations(readOnlyHint=True, openWorldHint=False)
CFDB_READ_ONLY = ToolAnnotations(readOnlyHint=True, openWorldHint=True)
CREATES = ToolAnnotations(
    readOnlyHint=False, destructiveHint=False, openWorldHint=False
)
OVERWRITES = ToolAnnotations(
    readOnlyHint=False, destructiveHint=True, openWorldHint=False
)

server = MCPServer(
    name="cvh",
    instructions=(
        "Access to the Community Visualization Hub (CVH): the user's workspaces, the "
        "genomic datasets in them, and Gosling or Vitessce visualizations, which "
        "you can create and edit. Published visualizations can be read without "
        "signing in and are good examples of working Gosling specs. "
        "The cfdb tools search Common Fund (CFDE) file metadata without signing in; "
        "their filters match exactly, so look values up with cfdb_field_values first, "
        "per DCC: DCCs name the same thing differently (ENCODE's \"Hi-C\" is 4DN's "
        '"bulk Hi-C assay"), and cfdb uses GRCh38/GRCm38 where CVH datasets say '
        "hg38/mm10."
    ),
)

_lock = threading.Lock()
_token: str | None = None
_pending: dict | None = None  # Auth0 device-code response while the user signs in


def _token_owner() -> dict:
    # A token saved for one CVH deployment is never sent to another.
    return {"api_url": API_URL, "domain": AUTH0_DOMAIN, "audience": AUTH0_AUDIENCE}


def _load_token() -> str | None:
    try:
        saved = json.loads(TOKEN_PATH.read_text())
    except (OSError, ValueError):
        return None
    if not isinstance(saved, dict) or saved.get("owner") != _token_owner():
        return None
    return saved.get("access_token")


def _save_token(token: str) -> None:
    try:
        TOKEN_PATH.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        # Created with owner-only permissions, never world-readable even briefly.
        fd = os.open(TOKEN_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as file:
            json.dump({"owner": _token_owner(), "access_token": token}, file)
    except OSError:
        pass  # can't cache: the user just signs in again next start


def _forget_token() -> None:
    global _token
    with _lock:
        _token = None
    TOKEN_PATH.unlink(missing_ok=True)


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
        _save_token(token_data["access_token"])
    except DeviceAuthorizationError:
        pass  # denied or expired: the next tool call starts a fresh flow
    finally:
        with _lock:
            if _pending is device:
                _pending = None


def _signed_in_client() -> CVHClient:
    """Return a client for the signed-in user, or start sign-in and raise ToolError."""
    global _token, _pending
    with _lock:
        if _token is None:
            _token = _load_token()
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
    except NotFoundError as exc:
        # The API answers 404 both for missing records and for ones the user can't see.
        raise ToolError(
            f"Nothing found: no record with that UUID, or the user doesn't have access "
            f"to it. ({exc})"
        ) from exc
    except AuthorizationError as exc:
        if exc.status_code == 401:
            _forget_token()  # revoked or rejected: sign in again on the next call
        raise ToolError(str(exc)) from exc
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
    is a genome assembly such as "hg38"; `file_type` matches a dataset's
    `file_type` exactly, e.g. bigwig or multivec (Gosling) or image.ome-tiff
    (Vitessce); `name` is a case-insensitive substring.
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
def list_visualizations(workspace_uuid: str, name: str | None = None) -> dict:
    """List visualizations in a workspace (without their configs; use get_visualization for one)."""
    items = _call(lambda c: c.list_visualizations(workspace_uuid, name=name))
    # The API returns a bare list; match the {items, count} shape of the other list tools.
    return {"items": items, "count": len(items)}


@server.tool(annotations=READ_ONLY)
def get_visualization(visualization_uuid: str) -> dict:
    """Get one visualization by UUID, including its full Gosling spec or Vitessce config (`conf`)."""
    return _call(lambda c: c.get_visualization(visualization_uuid))


@server.tool(annotations=READ_ONLY)
def search_public_visualizations(
    tags: list[str] | None = None, limit: int = 100, offset: int = 0
) -> dict:
    """List published visualizations, most recently modified first (not publish date). No sign-in needed.

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


# ── Visualization writes ───────────────────────────────────────────────


@functools.cache
def _gosling_validator() -> Draft7Validator:
    # gosling.schema.json is copied from gosling.js v2.0.0-alpha.10, the version CVH's
    # frontend uses; update it when CVH upgrades gosling.js. Same check as gosling.js's
    # validateGoslingSpec (Ajv, draft-07; the only keyword beside its $refs is description).
    schema = json.loads((Path(__file__).parent / "gosling.schema.json").read_text())
    return Draft7Validator(schema)


def _gosling_errors(spec: Any, limit: int = 3) -> list[str]:
    """The most useful schema errors, as `path: message` lines."""

    # The spec is an anyOf of several shapes, so the top-level error only says "not
    # valid under any of the given schemas". The real problems are its leaf errors:
    # prefer the deepest path, then messages most anyOf branches agree on, and put
    # "required" last since most of those come from branches that don't apply.
    def leaves(error):
        if not error.context:
            yield error
        for child in error.context:
            yield from leaves(child)

    counts: dict[tuple[str, str], int] = {}
    depth: dict[tuple[str, str], int] = {}
    for error in _gosling_validator().iter_errors(spec):
        for leaf in leaves(error):
            key = (leaf.json_path, leaf.message[:300])  # enum messages list every value
            counts[key] = counts.get(key, 0) + 1
            depth[key] = len(leaf.absolute_path) - (leaf.validator == "required")
    ranked = sorted(counts, key=lambda key: (-depth[key], -counts[key]))
    return [f"{path}: {message}" for path, message in ranked[:limit]]


def _check_gosling(spec: Any) -> None:
    errors = _gosling_errors(spec)
    if errors:
        raise ToolError(
            "Not saved: the Gosling spec is invalid (most likely cause first). Fix it "
            "and try again:\n" + "\n".join(errors)
        )


def _tracks(spec: Any, parent: dict | None = None):
    """Yield (track, parent) for every track, like gosling-designer-vec's traverseTracks."""
    if not isinstance(spec, dict):
        return
    if isinstance(spec.get("tracks"), list):
        for track in spec["tracks"]:
            yield track, spec
            yield from _tracks(track, spec)
    elif isinstance(spec.get("views"), list):
        for view in spec["views"]:
            yield from _tracks(view, spec)


def _gosling_counts(spec: dict) -> dict:
    """n_tracks and n_datasets as the CVH frontend computes them when it saves (getNumTracks/getNumDatasets)."""
    n_tracks = sum(
        1
        for track, parent in _tracks(spec)
        if isinstance(track, dict)
        and parent.get("alignment") != "overlay"  # layers of an overlay count once
        and "type" not in track  # dummy tracks
    )
    urls = {
        track["data"]["url"]
        for track, _ in _tracks(spec)
        if isinstance(track, dict)
        and isinstance(track.get("data"), dict)
        and "url" in track["data"]
    }
    return {"n_tracks": n_tracks, "n_datasets": len(urls)}


def _conf_fields(tool: str, conf: dict) -> dict:
    if tool != "gosling":
        return {"conf": conf}  # shortcut: Vitessce configs aren't validated yet
    _check_gosling(conf)
    return {"conf": conf, **_gosling_counts(conf)}


@server.tool(annotations=CREATES)
def create_visualization(
    workspace_uuid: str,
    name: str,
    conf: dict | None = None,
    tool: Literal["gosling", "vitessce"] = "gosling",
    description: str | None = None,
    author: str | None = None,
) -> dict:
    """Create a private visualization in a workspace the user can write to.

    `conf` is the full Gosling spec (or Vitessce config). A Gosling spec is
    validated first, and nothing is created if it's invalid; the errors come back
    so you can fix them. Read a published Gosling visualization for a working
    example. Returns the new visualization, including its `uuid`.
    """
    fields = _conf_fields(tool, conf) if conf is not None else {}
    created = _call(
        lambda c: c.create_visualization(
            workspace_uuid, name, description=description, author=author, tool=tool
        )
    )
    if not fields:
        return created
    try:
        _call(lambda c: c.update_visualization(created["uuid"], **fields))
    except ToolError as exc:
        raise ToolError(
            f"Created visualization {created['uuid']} but saving its config failed; "
            f"retry with update_visualization. {exc}"
        ) from exc
    return {**created, **fields}


@server.tool(annotations=OVERWRITES)
def update_visualization(
    visualization_uuid: str,
    conf: dict | None = None,
    name: str | None = None,
    description: str | None = None,
    author: str | None = None,
) -> dict:
    """Change a visualization's config, name, description or author.

    `conf` replaces the whole config, so start from get_visualization's `conf`
    and change only what's needed. A Gosling spec is validated first and nothing
    is saved if it's invalid. Doesn't publish; the visualization stays as public
    or private as it was.
    """
    fields: dict[str, Any] = {
        key: value
        for key, value in (
            ("name", name),
            ("description", description),
            ("author", author),
        )
        if value is not None
    }
    if conf is not None:
        tool = _call(lambda c: c.get_visualization(visualization_uuid))["tool"]
        fields.update(_conf_fields(tool, conf))
    if not fields:
        raise ToolError("Nothing to update: pass conf, name, description or author.")
    _call(lambda c: c.update_visualization(visualization_uuid, **fields))
    return {"uuid": visualization_uuid, "updated": sorted(fields)}


# ── cfdb (CFDE file metadata, public GraphQL) ─────────────────────────

# Friendly names for the fields cfdb can list distinct values of.
CFDB_FIELDS = {
    "dcc": "dcc.dcc_abbreviation",
    "file_format": "file_format.name",
    "assay_type": "assay_type.name",
    "data_type": "data_type.name",
    "genome_assembly": "genome_assembly",
    "output_type": "output_type",
    "data_access_level": "data_access_level",
}
CfdbField = Literal[
    "dcc",
    "file_format",
    "assay_type",
    "data_type",
    "genome_assembly",
    "output_type",
    "data_access_level",
]
CFDB_MAX_PAGE_SIZE = 500  # cfdb rejects larger pages
# shortcut: a breakdown is one count per value, so cap it; narrow the filters past this.
CFDB_MAX_GROUPS = 50
CfdbGroupField = Literal[
    "dcc", "file_format", "assay_type", "data_type", "genome_assembly"
]

CFDB_FILE_FIELDS = """
  localId filename persistentId accessUrl sizeInBytes genomeAssembly
  dcc { dccAbbreviation } fileFormat { name } assayType { name } dataType { name }
  collections { name }
"""
CFDB_FILE_DETAIL_FIELDS = (
    CFDB_FILE_FIELDS
    + """
  idNamespace creationTime md5 sha256 mimeType compressionFormat analysisType
  outputType outputTypeDetail dataAccessLevel genomeAnnotation condition assayInfo
  project { name description } collections { name description lab experimentType
  experimentTarget anatomy { name } }
"""
)


def _cfdb_input(
    dcc: list[str] | None = None,
    file_format: list[str] | None = None,
    assay_type: list[str] | None = None,
    data_type: list[str] | None = None,
    genome_assembly: list[str] | None = None,
    filename: list[str] | None = None,
    local_id: list[str] | None = None,
) -> list[dict] | None:
    """Build cfdb's nested FileMetadataInput from flat filters."""
    filters: dict[str, Any] = {}
    if dcc:
        filters["dcc"] = [{"dccAbbreviation": dcc}]
    if file_format:
        filters["fileFormat"] = [{"name": file_format}]
    if assay_type:
        filters["assayType"] = [{"name": assay_type}]
    if data_type:
        filters["dataType"] = [{"name": data_type}]
    if genome_assembly:
        filters["genomeAssembly"] = genome_assembly
    if filename:
        filters["filename"] = filename
    if local_id:
        filters["localId"] = local_id
    return [filters] if filters else None


def _cfdb_query(query: str, variables: dict[str, Any]) -> dict:
    try:
        response = httpx.post(
            f"{CFDB_URL}/metadata",
            json={"query": query, "variables": variables},
            timeout=60,
        )
        response.raise_for_status()
        body = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ToolError(f"cfdb request failed: {exc}") from exc
    if body.get("errors"):
        raise ToolError(f"cfdb error: {body['errors'][0].get('message')}")
    return body["data"]


@server.tool(annotations=CFDB_READ_ONLY)
def count_cfdb_files(
    dcc: list[str] | None = None,
    file_format: list[str] | None = None,
    assay_type: list[str] | None = None,
    data_type: list[str] | None = None,
    genome_assembly: list[str] | None = None,
    group_by: CfdbGroupField | None = None,
) -> dict:
    """Count CFDE files in cfdb matching the filters, optionally broken down by one field.

    With `group_by`, returns `groups` ({value: count}) and `no_value`, the files
    with no value for that field. Filters match exact, case-sensitive values
    (look them up with cfdb_field_values, per DCC); values in one list combine
    with OR, different filters with AND. `dcc` takes abbreviations such as
    "4DN_DCIC" or "ENCODE". No sign-in needed.
    """
    filters = {
        "dcc": dcc,
        "file_format": file_format,
        "assay_type": assay_type,
        "data_type": data_type,
        "genome_assembly": genome_assembly,
    }
    count_query = "query($input: [FileMetadataInput!]) { fileCount(input: $input) }"

    def count(**kwargs: list[str] | None) -> int:
        return _cfdb_query(count_query, {"input": _cfdb_input(**kwargs)})["fileCount"]

    total = count(**filters)
    if group_by is None:
        return {"count": total}

    values = cfdb_field_values([group_by], **filters)[group_by]
    values = [value for value in values if isinstance(value, str)]
    if len(values) > CFDB_MAX_GROUPS:
        raise ToolError(
            f"{len(values)} distinct {group_by} values; narrow the filters to at "
            f"most {CFDB_MAX_GROUPS} before grouping."
        )
    with ThreadPoolExecutor(max_workers=8) as pool:
        counts = list(
            pool.map(lambda value: count(**{**filters, group_by: [value]}), values)
        )
    groups = dict(sorted(zip(values, counts), key=lambda item: -item[1]))
    return {"count": total, "groups": groups, "no_value": total - sum(counts)}


@server.tool(annotations=CFDB_READ_ONLY)
def cfdb_field_values(
    fields: list[CfdbField],
    dcc: list[str] | None = None,
    file_format: list[str] | None = None,
    assay_type: list[str] | None = None,
    data_type: list[str] | None = None,
    genome_assembly: list[str] | None = None,
) -> dict:
    """List the distinct values of cfdb fields, optionally among files matching the filters.

    Use it to find valid filter values, or to answer "which assays does ENCODE
    have?". Filters work as in count_cfdb_files. No sign-in needed.
    """
    data = _cfdb_query(
        "query($fields: [String!]!, $input: [FileMetadataInput!]) "
        "{ distinctValues(fields: $fields, input: $input) { field values } }",
        {
            "fields": [CFDB_FIELDS[name] for name in fields],
            "input": _cfdb_input(
                dcc, file_format, assay_type, data_type, genome_assembly
            ),
        },
    )
    by_path = {row["field"]: row["values"] for row in data["distinctValues"]}
    return {name: by_path.get(CFDB_FIELDS[name], []) for name in fields}


@server.tool(annotations=CFDB_READ_ONLY)
def search_cfdb_files(
    dcc: list[str] | None = None,
    file_format: list[str] | None = None,
    assay_type: list[str] | None = None,
    data_type: list[str] | None = None,
    genome_assembly: list[str] | None = None,
    filename: list[str] | None = None,
    page: int = 0,
    page_size: int = 25,
) -> dict:
    """Search CFDE files in cfdb, one page at a time (`page` starts at 0, at most 500 per page).

    Returns `count` (all matches) and this page's `items`. Some files have no
    `fileFormat` (e.g. 4DN .pairs.gz and .hic), so a `file_format` filter skips them. For "how many" or
    "broken down by" questions use count_cfdb_files or cfdb_field_values instead
    of paging through files. Filters work as in count_cfdb_files, plus an exact
    `filename`. No sign-in needed.
    """
    data = _cfdb_query(
        "query($input: [FileMetadataInput!], $page: Int!, $pageSize: Int!) "
        "{ files(input: $input, page: $page, pageSize: $pageSize) "
        f"{{ totalCount items {{ {CFDB_FILE_FIELDS} }} }} }}",
        {
            "input": _cfdb_input(
                dcc, file_format, assay_type, data_type, genome_assembly, filename
            ),
            "page": max(page, 0),
            "pageSize": min(max(page_size, 1), CFDB_MAX_PAGE_SIZE),
        },
    )
    return {"count": data["files"]["totalCount"], "items": data["files"]["items"]}


@server.tool(annotations=CFDB_READ_ONLY)
def get_cfdb_file(dcc: str, local_id: str) -> dict:
    """Get full metadata for one CFDE file by its DCC abbreviation and `localId`. No sign-in needed."""
    data = _cfdb_query(
        "query($input: [FileMetadataInput!]) "
        f"{{ files(input: $input, pageSize: 1) {{ items {{ {CFDB_FILE_DETAIL_FIELDS} }} }} }}",
        {"input": _cfdb_input(dcc=[dcc], local_id=[local_id])},
    )
    items = data["files"]["items"]
    if not items:
        raise ToolError(f"No cfdb file with localId {local_id!r} in {dcc!r}.")
    return items[0]


def main() -> None:
    server.run()


if __name__ == "__main__":
    main()
