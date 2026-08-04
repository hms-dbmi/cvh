from unittest.mock import MagicMock

import httpx
import pytest

from cvh_client import CVHClient
from cvh_client.exceptions import AuthorizationError, CVHAPIError, NotFoundError


def _mock_response(status_code, json_body=None, text=""):
    response = MagicMock(spec=httpx.Response)
    response.status_code = status_code
    response.is_success = 200 <= status_code < 300
    response.text = text
    response.request = MagicMock()
    response.request.method = "GET"
    response.request.url = "https://example.com/api/test"
    if json_body is not None:
        response.json.return_value = json_body
    else:
        response.json.side_effect = Exception("no json")
    return response


class TestRaiseForStatus:
    def test_success_does_not_raise(self):
        response = _mock_response(200)
        CVHClient._raise_for_status(response)

    def test_404_raises_not_found(self):
        response = _mock_response(404, {"detail": "Visualization not found"})
        with pytest.raises(NotFoundError, match="404") as exc_info:
            CVHClient._raise_for_status(response)
        assert "Visualization not found" in str(exc_info.value)
        assert exc_info.value.status_code == 404

    def test_401_raises_authorization_error(self):
        response = _mock_response(401, {"detail": "Not authenticated"})
        with pytest.raises(AuthorizationError, match="401"):
            CVHClient._raise_for_status(response)

    def test_403_raises_authorization_error(self):
        response = _mock_response(403, {"detail": "Insufficient permissions"})
        with pytest.raises(AuthorizationError, match="403"):
            CVHClient._raise_for_status(response)

    def test_500_raises_api_error(self):
        response = _mock_response(500, {"detail": "Internal server error"})
        with pytest.raises(CVHAPIError, match="500"):
            CVHClient._raise_for_status(response)

    def test_error_with_plain_text(self):
        response = _mock_response(502, text="Bad Gateway")
        with pytest.raises(CVHAPIError, match="Bad Gateway"):
            CVHClient._raise_for_status(response)

    def test_error_attributes(self):
        response = _mock_response(404, {"detail": "Not found"})
        with pytest.raises(NotFoundError) as exc_info:
            CVHClient._raise_for_status(response)
        err = exc_info.value
        assert err.status_code == 404
        assert err.method == "GET"
        assert "example.com" in err.url
        assert err.detail == {"detail": "Not found"}
