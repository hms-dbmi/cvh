from __future__ import annotations

from typing import Any

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
    """API client for CVH."""

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
        """Create a client by logging in via Auth0 device authorization flow."""
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
        """Create a new workspace."""
        data = self.post(
            "/api/workspaces",
            json={"name": name, "description": description, "private": private},
        )
        return Workspace.model_validate(data)

    def list_workspaces(self, limit: int = 100, offset: int = 0) -> PagedWorkspaces:
        """List workspaces the authenticated user has access to."""
        data = self.get("/api/workspaces", params={"limit": limit, "offset": offset})
        return PagedWorkspaces.model_validate(data)

    def get_workspace(self, workspace_uuid: str) -> Workspace:
        """Get a single workspace by UUID."""
        data = self.get(f"/api/workspaces/{workspace_uuid}")
        return Workspace.model_validate(data)

    def update_workspace(self, workspace_uuid: str, **fields) -> dict:
        """Update a workspace's metadata.

        Pass keyword arguments for fields to update, e.g.:
            client.update_workspace(uuid, name="new name", private=False)
        """
        return self.put(f"/api/workspaces/{workspace_uuid}", json=fields)

    def delete_workspace(self, workspace_uuid: str) -> None:
        """Delete a workspace."""
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
        page: int = 1,
        page_size: int | None = None,
    ) -> PagedDatasets:
        """List datasets in a workspace with optional filters."""
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
        data = self.get(f"/api/workspaces/{workspace_uuid}/datasets", params=params)
        return PagedDatasets.model_validate(data)

    def get_dataset(self, dataset_uuid: str) -> Dataset:
        """Get a single dataset by UUID."""
        data = self.get(f"/api/datasets/{dataset_uuid}")
        return Dataset.model_validate(data)

    def update_dataset(self, dataset_uuid: str, **fields) -> dict:
        """Update a dataset's metadata.

        Pass keyword arguments for fields to update, e.g.:
            client.update_dataset(uuid, name="new name", assembly="hg38")
        """
        return self.put(f"/api/datasets/{dataset_uuid}", json=fields)

    def delete_dataset(self, dataset_uuid: str) -> None:
        """Delete a dataset."""
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
        """Create a new visualization in a workspace."""
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
        """List visualizations in a workspace with optional filters."""
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
        """Get a single visualization by UUID."""
        data = self.get(f"/api/visualizations/{visualization_uuid}")
        return Visualization.model_validate(data)

    def update_visualization(self, visualization_uuid: str, **fields) -> dict:
        """Update a visualization's metadata or configuration.

        Pass keyword arguments for fields to update, e.g.:
            client.update_visualization(uuid, name="new name", conf={...})
        """
        return self.put(f"/api/visualizations/{visualization_uuid}", json=fields)

    def delete_visualization(self, visualization_uuid: str) -> None:
        """Delete a visualization."""
        self.delete(f"/api/visualizations/{visualization_uuid}")

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
