from __future__ import annotations

from typing import Any, Literal

import httpx

from cvh_client.auth import TokenExpiredError, is_token_expired, login
from cvh_client.exceptions import (
    AuthorizationError,
    CVHAPIError,
    CVHError,
    NotFoundError,
)
from cvh_client.models import (
    Dataset,
    PagedDatasets,
    PagedWorkspaces,
    Visualization,
    VisualizationSummary,
    Workspace,
)


class CVHClient:
    """HTTP client for the Community Visualization Hub API.

    Typical usage — authenticate once, then call resource methods:

        client = CVHClient.from_login(
            base_url="https://api.visualizationhub.org",
            domain="auth.visualizationhub.org",
            client_id="BlOrQcABtV8FrluOQnIO3bWCG1MQU9bx",
            audience="cvh-api-prod-id",
        )
        workspaces = client.list_workspaces()

    All methods return typed pydantic models (`Workspace`, `Dataset`,
    `Visualization`, etc.) — introspect them with `?` in a notebook or
    dot-access their fields.

    Methods are grouped by resource. Each has a docstring with args,
    return type, and an example — access with `Shift+Tab` in a
    notebook or `client.<method>?`:

        Workspaces:      create_workspace, list_workspaces,
                         get_workspace, update_workspace, delete_workspace
        Datasets:        list_datasets, get_dataset, update_dataset,
                         delete_dataset
        Visualizations:  create_visualization, list_visualizations,
                         get_visualization, update_visualization,
                         delete_visualization

    The client is a context manager — using `with CVHClient(...) as client:`
    ensures the underlying HTTP connection pool is closed.

    Errors are raised as `CVHError` subclasses. Catch `NotFoundError`
    for 404s, `AuthorizationError` for 401/403, and `CVHAPIError` as a
    catch-all for other 4xx/5xx responses.
    """

    def __init__(self, base_url: str, token: str | None = None, timeout: float = 30.0):
        self._base_url = base_url
        self._timeout = timeout
        self._token = token
        self._auth_params: dict | None = None
        self._client = self._build_client(token)

    def _build_client(self, token: str | None) -> httpx.Client:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return httpx.Client(
            base_url=self._base_url, headers=headers, timeout=self._timeout
        )

    @classmethod
    def from_login(
        cls,
        base_url: str,
        domain: str,
        client_id: str,
        scope: str = "openid profile email",
        audience: str | None = None,
        timeout: float = 30.0,
    ) -> CVHClient:
        """Create a client by logging in via Auth0's device authorization flow.

        Prints a URL + code to stdout; open the URL in a browser, enter
        the code, and finish authentication. Blocks until the flow
        completes or the user cancels.

        The returned client automatically re-authenticates when its
        access token expires (using the same domain / client_id /
        audience the initial login used).

        Args:
            base_url: URL of the CVH API, e.g. `https://api.visualizationhub.org`.
            domain: Auth0 tenant domain, e.g. `auth.visualizationhub.org`.
            client_id: Auth0 SPA client id (public, embedded in the frontend).
            scope: OAuth scopes to request. The default covers the API.
            audience: Auth0 API identifier. Must match what the backend expects.
            timeout: Per-request HTTP timeout, seconds.

        Returns:
            An authenticated `CVHClient` ready for use.

        Example:
            >>> client = CVHClient.from_login(
            ...     base_url="https://api.visualizationhub.org",
            ...     domain="auth.visualizationhub.org",
            ...     client_id="BlOrQcABtV8FrluOQnIO3bWCG1MQU9bx",
            ...     audience="cvh-api-prod-id",
            ... )
        """
        token_data = login(
            domain=domain,
            client_id=client_id,
            scope=scope,
            audience=audience,
        )
        client = cls(
            base_url=base_url, token=token_data["access_token"], timeout=timeout
        )
        client._auth_params = {
            "domain": domain,
            "client_id": client_id,
            "scope": scope,
            "audience": audience,
        }
        return client

    def _ensure_valid_token(self):
        """Re-authenticate if the current token is expired."""
        if self._token and is_token_expired(self._token):
            if self._auth_params is None:
                raise TokenExpiredError(
                    "Access token has expired. Create a new client with from_login() "
                    "or provide a fresh token."
                )
            print("Token expired, re-authenticating...")
            token_data = login(**self._auth_params)
            self._token = token_data["access_token"]
            self._client.close()
            self._client = self._build_client(self._token)

    @staticmethod
    def _raise_for_status(response: httpx.Response) -> None:
        """Raise a descriptive error for non-2xx responses."""
        if response.is_success:
            return
        if response.status_code == 404:
            raise NotFoundError(response)
        if response.status_code in (401, 403):
            raise AuthorizationError(response)
        raise CVHAPIError(response)

    def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        self._ensure_valid_token()
        response = self._client.request(method, path, **kwargs)
        self._raise_for_status(response)
        return response

    @staticmethod
    def _parse_json(response: httpx.Response) -> dict:
        """Parse JSON from a response, raising a clear error if the body is empty."""
        if not response.content:
            raise CVHError(
                f"Expected JSON response from {response.request.method} {response.request.url} "
                f"but got empty body (status {response.status_code}). "
                f"Check that the base_url and path are correct."
            )
        try:
            return response.json()
        except ValueError as exc:
            raise CVHError(
                f"Expected JSON response from {response.request.method} {response.request.url} "
                f"but could not decode body (status {response.status_code}): {response.text[:200]}"
            ) from exc

    def get(self, path: str, **kwargs) -> dict:
        return self._parse_json(self._request("GET", path, **kwargs))

    def post(self, path: str, **kwargs) -> dict:
        return self._parse_json(self._request("POST", path, **kwargs))

    def put(self, path: str, **kwargs) -> dict:
        return self._parse_json(self._request("PUT", path, **kwargs))

    def delete(self, path: str, **kwargs) -> dict | None:
        response = self._request("DELETE", path, **kwargs)
        if not response.content:
            return None
        return response.json()

    # ── Workspaces ──────────────────────────────────────────────

    def create_workspace(
        self, name: str, description: str, *, private: bool = True
    ) -> Workspace:
        """Create a new workspace owned by the authenticated user.

        The workspace becomes the authenticated user's admin-permission
        workspace; an initial (empty) visualization is created inside it
        automatically by the backend.

        Args:
            name: Human-readable workspace name.
            description: Free-text description. Empty string is allowed.
            private: If True (default), only the authenticated user and
                explicit collaborators can access it. If False, listed on
                the public workspaces endpoint.

        Returns:
            The created `Workspace`.

        Raises:
            CVHAPIError: The server rejected the create (validation or auth).

        Example:
            >>> ws = client.create_workspace("Cortex atlas", "Working set for the cortex paper")
        """
        data = self.post(
            "/api/workspaces",
            json={"name": name, "description": description, "private": private},
        )
        return Workspace.model_validate(data)

    def list_workspaces(self, limit: int = 100, offset: int = 0) -> PagedWorkspaces:
        """List workspaces the authenticated user has access to.

        Args:
            limit: Max results per page.
            offset: Zero-based offset for pagination.

        Returns:
            `PagedWorkspaces` — `.items: list[Workspace]` and `.count: int`
            (total across all pages).
        """
        data = self.get("/api/workspaces", params={"limit": limit, "offset": offset})
        return PagedWorkspaces.model_validate(data)

    def get_workspace(self, workspace_uuid: str) -> Workspace:
        """Fetch a single workspace by UUID.

        Args:
            workspace_uuid: UUID of the workspace.

        Returns:
            The `Workspace`.

        Raises:
            NotFoundError: The workspace doesn't exist, or the
                authenticated user lacks read access. (The backend
                returns 404 rather than 403 for privacy.)
        """
        data = self.get(f"/api/workspaces/{workspace_uuid}")
        return Workspace.model_validate(data)

    def update_workspace(self, workspace_uuid: str, **fields) -> dict:
        """Partially update a workspace. Requires admin permission.

        Only pass the fields you want to change; unnamed fields are
        left alone.

        Args:
            workspace_uuid: UUID of the workspace.
            **fields: Updatable fields — `name`, `description`, `private`.

        Returns:
            Raw JSON response body (currently `{"success": True}`).

        Raises:
            AuthorizationError: The user isn't an admin on the workspace.
            CVHAPIError: Validation failed.

        Example:
            >>> client.update_workspace(ws.uuid, name="Renamed", private=False)
        """
        return self.put(f"/api/workspaces/{workspace_uuid}", json=fields)

    def delete_workspace(self, workspace_uuid: str) -> None:
        """Permanently delete a workspace and all its data.

        Cascades to every dataset and visualization inside the
        workspace. Irreversible. Requires admin permission.

        Args:
            workspace_uuid: UUID of the workspace.

        Raises:
            AuthorizationError: The user isn't an admin on the workspace.
        """
        self.delete(f"/api/workspaces/{workspace_uuid}")

    # ── Datasets ────────────────────────────────────────────────

    def list_datasets(
        self,
        workspace_uuid: str,
        *,
        tags: list[str] | None = None,
        assembly: list[str] | None = None,
        file_type: list[str] | None = None,
        name: str | None = None,
        tool: Literal["gosling", "vitessce"] | None = None,
        page: int = 1,
        page_size: int | None = None,
    ) -> PagedDatasets:
        """List datasets in a workspace, filterable by tag/assembly/type/name/tool.

        All filter kwargs combine with AND. Filters within a single list
        combine with OR (e.g. `file_type=["bigwig", "cooler"]` returns
        both).

        Args:
            workspace_uuid: UUID of the workspace.
            tags: Restrict to datasets tagged with any of these tag UUIDs.
            assembly: Restrict to these genome assemblies, e.g.
                `["hg38", "mm10"]`.
            file_type: Restrict to these file types, e.g.
                `["bigwig", "bam"]`.
            name: Case-insensitive substring match against dataset name.
            tool: Restrict to a single viewer's datasets — `"gosling"`
                or `"vitessce"`. Useful when the workspace mixes both
                and you only care about one.
            page: 1-based page number.
            page_size: Results per page. Backend default if `None`.

        Returns:
            `PagedDatasets` — `.items: list[Dataset]`, `.count: int`.

        Example:
            >>> hg38_bigwigs = client.list_datasets(
            ...     ws.uuid, file_type=["bigwig"], assembly=["hg38"]
            ... )
            >>> for ds in hg38_bigwigs.items:
            ...     print(ds.name, ds.source_url)
        """
        params: dict[str, Any] = {"page": page}
        if page_size is not None:
            params["page_size"] = page_size
        if tags:
            params["tags"] = tags
        if assembly:
            params["assembly"] = assembly
        if file_type:
            params["file_type"] = file_type
        if name:
            params["name"] = name
        if tool is not None:
            params["tool"] = tool
        data = self.get(f"/api/workspaces/{workspace_uuid}/datasets", params=params)
        return PagedDatasets.model_validate(data)

    def get_dataset(self, dataset_uuid: str) -> Dataset:
        """Fetch a single dataset by UUID.

        Args:
            dataset_uuid: UUID of the dataset.

        Returns:
            The `Dataset`, including its tags and processing state.

        Raises:
            NotFoundError: The dataset doesn't exist, or the user lacks
                read access to its parent workspace.
        """
        data = self.get(f"/api/datasets/{dataset_uuid}")
        return Dataset.model_validate(data)

    def update_dataset(self, dataset_uuid: str, **fields) -> dict:
        """Partially update a dataset. Requires write access to the workspace.

        Args:
            dataset_uuid: UUID of the dataset.
            **fields: Updatable fields — `name`, `description`,
                `source_url`, `file_type`, `tool`, `data_type`,
                `assembly`, `data_column`, `row_names`, `headers`,
                `index_url`, `separator`.

        Returns:
            Raw JSON response body.

        Raises:
            AuthorizationError: User has read-only permission on the workspace.

        Example:
            >>> client.update_dataset(ds.uuid, name="Renamed", assembly="hg38")
        """
        return self.put(f"/api/datasets/{dataset_uuid}", json=fields)

    def delete_dataset(self, dataset_uuid: str) -> None:
        """Delete a dataset from its workspace. Irreversible.

        Args:
            dataset_uuid: UUID of the dataset.

        Raises:
            AuthorizationError: User has read-only permission on the workspace.
        """
        self.delete(f"/api/datasets/{dataset_uuid}")

    # ── Visualizations ──────────────────────────────────────────

    def create_visualization(
        self,
        workspace_uuid: str,
        name: str,
        *,
        description: str | None = None,
        author: str | None = None,
        tool: str = "gosling",
    ) -> Visualization:
        """Create a new (empty) visualization in a workspace.

        The visualization starts with no config; use `update_visualization`
        to attach a Gosling spec or Vitessce config once created.

        Args:
            workspace_uuid: UUID of the parent workspace.
            name: Human-readable visualization name.
            description: Free-text description.
            author: Attribution string shown in the UI.
            tool: `"gosling"` (default) or `"vitessce"`.

        Returns:
            The created `Visualization` (with `conf=None`).

        Raises:
            AuthorizationError: User has read-only permission on the workspace.

        Example:
            >>> viz = client.create_visualization(
            ...     ws.uuid,
            ...     name="Cortex spatial",
            ...     tool="vitessce",
            ... )
            >>> client.update_visualization(viz.uuid, conf=my_vitessce_config)
        """
        body: dict[str, Any] = {
            "workspace_uuid": workspace_uuid,
            "name": name,
            "tool": tool,
        }
        if description is not None:
            body["description"] = description
        if author is not None:
            body["author"] = author
        data = self.post("/api/visualizations", json=body)
        return Visualization.model_validate(data)

    def list_visualizations(
        self,
        workspace_uuid: str,
        *,
        tags: list[str] | None = None,
        name: str | None = None,
        uuids: list[str] | None = None,
    ) -> list[VisualizationSummary]:
        """List visualizations in a workspace.

        Returns `VisualizationSummary` (without the full `conf` blob) —
        call `get_visualization` on a specific UUID to fetch the config.

        Args:
            workspace_uuid: UUID of the workspace.
            tags: Restrict to visualizations tagged with any of these tag UUIDs.
            name: Case-insensitive substring match against visualization name.
            uuids: Restrict to specific UUIDs (useful for bulk fetches).

        Returns:
            List of `VisualizationSummary`. Not paginated.
        """
        params: dict[str, Any] = {}
        if tags:
            params["tags"] = tags
        if name:
            params["name"] = name
        if uuids:
            params["uuids"] = uuids
        data = self.get(
            f"/api/workspaces/{workspace_uuid}/visualizations", params=params
        )
        return [VisualizationSummary.model_validate(v) for v in data]

    def get_visualization(self, visualization_uuid: str) -> Visualization:
        """Fetch a single visualization by UUID, including its full config.

        Args:
            visualization_uuid: UUID of the visualization.

        Returns:
            The `Visualization`, with `.conf` populated (the Gosling
            spec or Vitessce config).

        Raises:
            NotFoundError: Visualization doesn't exist, or the user
                lacks read access to the parent workspace and it isn't
                published.
        """
        data = self.get(f"/api/visualizations/{visualization_uuid}")
        return Visualization.model_validate(data)

    def update_visualization(self, visualization_uuid: str, **fields) -> dict:
        """Partially update a visualization's metadata or configuration.

        The most common use is attaching or replacing `conf` — the
        full Gosling spec or Vitessce config as a dict.

        Args:
            visualization_uuid: UUID of the visualization.
            **fields: Updatable fields — `name`, `description`,
                `author`, `tool`, `conf`, `published`, `n_tracks`,
                `n_datasets`.

        Returns:
            Raw JSON response body.

        Raises:
            AuthorizationError: User has read-only permission on the workspace.

        Example:
            >>> client.update_visualization(viz.uuid, conf=new_gosling_spec)
            >>> client.update_visualization(viz.uuid, published=True)
        """
        return self.put(f"/api/visualizations/{visualization_uuid}", json=fields)

    def delete_visualization(self, visualization_uuid: str) -> None:
        """Delete a visualization from its workspace. Irreversible.

        Args:
            visualization_uuid: UUID of the visualization.

        Raises:
            AuthorizationError: User has read-only permission on the workspace.
        """
        self.delete(f"/api/visualizations/{visualization_uuid}")

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
