import base64
import json
import time
from unittest.mock import patch

import pytest

from cvh_client import CVHClient
from cvh_client.auth import TokenExpiredError
from cvh_client.models import (
    Dataset,
    PagedDatasets,
    PagedWorkspaces,
    Visualization,
    VisualizationSummary,
    Workspace,
)


def _make_jwt(payload: dict) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "RS256"}).encode()).rstrip(
        b"="
    )
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=")
    signature = base64.urlsafe_b64encode(b"fake-signature").rstrip(b"=")
    return f"{header.decode()}.{body.decode()}.{signature.decode()}"


WORKSPACE_DATA = {
    "uuid": "ws-uuid-1",
    "name": "Test Workspace",
    "description": "A test workspace",
    "private": True,
    "datasets_count": 3,
    "visualizations_count": 2,
    "permissions": 1,
    "created_timestamp": "2025-01-01T00:00:00Z",
    "modified_timestamp": "2025-01-02T00:00:00Z",
    "last_viewed_timestamp": "2025-01-03T00:00:00Z",
    "workspace_members_count": 1,
}

DATASET_DATA = {
    "uuid": "ds-uuid-1",
    "name": "Test Dataset",
    "source_url": "https://example.com/data.bigwig",
    "file_type": "bigwig",
    "data_type": "quantitative",
    "assembly": "hg38",
    "created_timestamp": "2025-01-01T00:00:00Z",
    "modified_timestamp": "2025-01-02T00:00:00Z",
    "last_viewed_timestamp": "2025-01-03T00:00:00Z",
    "tags": [],
}

VISUALIZATION_DATA = {
    "uuid": "viz-uuid-1",
    "name": "Test Visualization",
    "description": "A test viz",
    "author": "tester",
    "tool": "gosling",
    "published": False,
    "conf": {"version": "1.0.16", "datasets": [], "layout": []},
    "created_timestamp": "2025-01-01T00:00:00Z",
    "modified_timestamp": "2025-01-02T00:00:00Z",
    "last_viewed_timestamp": "2025-01-03T00:00:00Z",
    "tags": [{"tag": "example", "key": "category", "uuid": "tag-uuid-1"}],
}

VISUALIZATION_SUMMARY_DATA = {
    "uuid": "viz-uuid-1",
    "name": "Test Visualization",
    "description": "A test viz",
    "author": "tester",
    "tool": "gosling",
    "published": False,
    "created_timestamp": "2025-01-01T00:00:00Z",
    "modified_timestamp": "2025-01-02T00:00:00Z",
    "last_viewed_timestamp": "2025-01-03T00:00:00Z",
    "tags": [{"tag": "example", "key": "category", "uuid": "tag-uuid-1"}],
}


def test_client_init():
    client = CVHClient(base_url="https://example.com")
    assert client._client.base_url == "https://example.com"
    client.close()


class TestTokenExpiration:
    def test_no_reauth_when_token_valid(self):
        token = _make_jwt({"exp": time.time() + 3600})
        client = CVHClient(base_url="https://example.com", token=token)

        with patch("cvh_client.client.login") as mock_login:
            client._ensure_valid_token()
            mock_login.assert_not_called()
        client.close()

    def test_raises_when_expired_and_no_auth_params(self):
        token = _make_jwt({"exp": time.time() - 60})
        client = CVHClient(base_url="https://example.com", token=token)

        with pytest.raises(TokenExpiredError, match="expired"):
            client._ensure_valid_token()
        client.close()

    def test_reauths_when_expired_with_auth_params(self):
        old_token = _make_jwt({"exp": time.time() - 60})
        new_token = _make_jwt({"exp": time.time() + 3600})

        client = CVHClient(base_url="https://example.com", token=old_token)
        client._auth_params = {
            "domain": "example.auth0.com",
            "client_id": "test-id",
            "scope": "openid",
            "audience": None,
        }

        with patch("cvh_client.client.login") as mock_login:
            mock_login.return_value = {"access_token": new_token}
            client._ensure_valid_token()

            mock_login.assert_called_once_with(**client._auth_params)
            assert client._token == new_token
        client.close()

    def test_no_check_when_no_token(self):
        client = CVHClient(base_url="https://example.com")

        with patch("cvh_client.client.login") as mock_login:
            client._ensure_valid_token()
            mock_login.assert_not_called()
        client.close()


class TestWorkspaces:
    @patch.object(CVHClient, "post")
    def test_create_workspace(self, mock_post):
        mock_post.return_value = WORKSPACE_DATA
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.create_workspace("Test Workspace", "A test workspace")

        assert isinstance(result, Workspace)
        assert result.name == "Test Workspace"
        mock_post.assert_called_once_with(
            "/api/workspaces",
            json={
                "name": "Test Workspace",
                "description": "A test workspace",
                "private": True,
            },
        )

    @patch.object(CVHClient, "get")
    def test_list_workspaces(self, mock_get):
        mock_get.return_value = {"items": [WORKSPACE_DATA], "count": 1}
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.list_workspaces()

        assert isinstance(result, PagedWorkspaces)
        assert result.count == 1
        assert result.items[0].name == "Test Workspace"
        assert result.items[0].uuid == "ws-uuid-1"
        mock_get.assert_called_once_with(
            "/api/workspaces", params={"limit": 100, "offset": 0}
        )

    @patch.object(CVHClient, "get")
    def test_get_workspace(self, mock_get):
        mock_get.return_value = WORKSPACE_DATA
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.get_workspace("ws-uuid-1")

        assert result.name == "Test Workspace"
        assert result.datasets_count == 3
        mock_get.assert_called_once_with("/api/workspaces/ws-uuid-1")

    @patch.object(CVHClient, "put")
    def test_update_workspace(self, mock_put):
        mock_put.return_value = {"success": True}
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.update_workspace("ws-uuid-1", name="Updated")

        assert result["success"] is True
        mock_put.assert_called_once_with(
            "/api/workspaces/ws-uuid-1", json={"name": "Updated"}
        )

    @patch.object(CVHClient, "delete")
    def test_delete_workspace(self, mock_delete):
        mock_delete.return_value = None
        client = CVHClient(base_url="https://example.com", token="fake")

        client.delete_workspace("ws-uuid-1")

        mock_delete.assert_called_once_with("/api/workspaces/ws-uuid-1")


class TestDatasets:
    @patch.object(CVHClient, "get")
    def test_list_datasets(self, mock_get):
        mock_get.return_value = {"items": [DATASET_DATA], "count": 1}
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.list_datasets("ws-uuid-1")

        assert isinstance(result, PagedDatasets)
        assert result.count == 1
        assert result.items[0].name == "Test Dataset"
        assert result.items[0].file_type == "bigwig"

    @patch.object(CVHClient, "get")
    def test_list_datasets_with_filters(self, mock_get):
        mock_get.return_value = {"items": [], "count": 0}
        client = CVHClient(base_url="https://example.com", token="fake")

        client.list_datasets(
            "ws-uuid-1", tags=["genomics"], assembly=["hg38"], name="test"
        )

        mock_get.assert_called_once_with(
            "/api/workspaces/ws-uuid-1/datasets",
            params={
                "page": 1,
                "tags": ["genomics"],
                "assembly": ["hg38"],
                "name": "test",
            },
        )

    @patch.object(CVHClient, "get")
    def test_get_dataset(self, mock_get):
        mock_get.return_value = DATASET_DATA
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.get_dataset("ds-uuid-1")

        assert isinstance(result, Dataset)
        assert result.assembly == "hg38"
        mock_get.assert_called_once_with("/api/datasets/ds-uuid-1")

    @patch.object(CVHClient, "put")
    def test_update_dataset(self, mock_put):
        mock_put.return_value = {"success": True}
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.update_dataset("ds-uuid-1", name="Updated")

        assert result["success"] is True
        mock_put.assert_called_once_with(
            "/api/datasets/ds-uuid-1",
            json={"name": "Updated"},
        )

    @patch.object(CVHClient, "delete")
    def test_delete_dataset(self, mock_delete):
        mock_delete.return_value = None
        client = CVHClient(base_url="https://example.com", token="fake")

        client.delete_dataset("ds-uuid-1")

        mock_delete.assert_called_once_with("/api/datasets/ds-uuid-1")


class TestVisualizations:
    @patch.object(CVHClient, "post")
    def test_create_visualization(self, mock_post):
        mock_post.return_value = VISUALIZATION_DATA
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.create_visualization(
            "ws-uuid-1", "Test Visualization", tool="vitessce", description="A test viz"
        )

        assert isinstance(result, Visualization)
        assert result.name == "Test Visualization"
        mock_post.assert_called_once_with(
            "/api/visualizations",
            json={
                "workspace_uuid": "ws-uuid-1",
                "name": "Test Visualization",
                "tool": "vitessce",
                "description": "A test viz",
            },
        )

    @patch.object(CVHClient, "get")
    def test_list_visualizations(self, mock_get):
        mock_get.return_value = [VISUALIZATION_SUMMARY_DATA]
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.list_visualizations("ws-uuid-1")

        assert isinstance(result, list)
        assert len(result) == 1
        assert isinstance(result[0], VisualizationSummary)
        assert result[0].name == "Test Visualization"
        mock_get.assert_called_once_with(
            "/api/workspaces/ws-uuid-1/visualizations", params={}
        )

    @patch.object(CVHClient, "get")
    def test_list_visualizations_with_filters(self, mock_get):
        mock_get.return_value = []
        client = CVHClient(base_url="https://example.com", token="fake")

        client.list_visualizations("ws-uuid-1", tags=["demo"], name="test")

        mock_get.assert_called_once_with(
            "/api/workspaces/ws-uuid-1/visualizations",
            params={"tags": ["demo"], "name": "test"},
        )

    @patch.object(CVHClient, "get")
    def test_list_visualizations_with_uuids(self, mock_get):
        mock_get.return_value = []
        client = CVHClient(base_url="https://example.com", token="fake")

        client.list_visualizations("ws-uuid-1", uuids=["uuid-1", "uuid-2"])

        mock_get.assert_called_once_with(
            "/api/workspaces/ws-uuid-1/visualizations",
            params={"uuids": ["uuid-1", "uuid-2"]},
        )

    @patch.object(CVHClient, "get")
    def test_get_visualization(self, mock_get):
        mock_get.return_value = VISUALIZATION_DATA
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.get_visualization("viz-uuid-1")

        assert isinstance(result, Visualization)
        assert result.conf == {"version": "1.0.16", "datasets": [], "layout": []}
        assert result.tags[0].tag == "example"
        mock_get.assert_called_once_with("/api/visualizations/viz-uuid-1")

    @patch.object(CVHClient, "put")
    def test_update_visualization(self, mock_put):
        mock_put.return_value = {"success": True}
        client = CVHClient(base_url="https://example.com", token="fake")

        result = client.update_visualization(
            "viz-uuid-1", name="Updated", conf={"tracks": [{"type": "bar"}]}
        )

        assert result["success"] is True
        mock_put.assert_called_once_with(
            "/api/visualizations/viz-uuid-1",
            json={"name": "Updated", "conf": {"tracks": [{"type": "bar"}]}},
        )

    @patch.object(CVHClient, "delete")
    def test_delete_visualization(self, mock_delete):
        mock_delete.return_value = None
        client = CVHClient(base_url="https://example.com", token="fake")

        client.delete_visualization("viz-uuid-1")

        mock_delete.assert_called_once_with("/api/visualizations/viz-uuid-1")
