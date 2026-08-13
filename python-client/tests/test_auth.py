import base64
import json
import time
from unittest.mock import patch, MagicMock

import pytest

from cvh_client.auth import (
    DeviceAuthorizationError,
    decode_token_payload,
    is_token_expired,
    login,
    poll_for_token,
    request_device_code,
)


@pytest.fixture
def device_code_response():
    return {
        "device_code": "test-device-code",
        "user_code": "ABCD-1234",
        "verification_uri": "https://example.auth0.com/activate",
        "verification_uri_complete": "https://example.auth0.com/activate?user_code=ABCD-1234",
        "expires_in": 900,
        "interval": 5,
    }


@pytest.fixture
def token_response():
    return {
        "access_token": "test-access-token",
        "id_token": "test-id-token",
        "token_type": "Bearer",
        "expires_in": 86400,
    }


class TestRequestDeviceCode:
    @patch("cvh_client.auth.httpx.post")
    def test_basic_request(self, mock_post, device_code_response):
        mock_post.return_value = MagicMock(
            status_code=200, json=lambda: device_code_response
        )

        result = request_device_code("example.auth0.com", "my-client-id")

        mock_post.assert_called_once_with(
            "https://example.auth0.com/oauth/device/code",
            data={"client_id": "my-client-id", "scope": "openid profile email"},
        )
        assert result["device_code"] == "test-device-code"
        assert result["user_code"] == "ABCD-1234"

    @patch("cvh_client.auth.httpx.post")
    def test_with_audience(self, mock_post, device_code_response):
        mock_post.return_value = MagicMock(
            status_code=200, json=lambda: device_code_response
        )

        request_device_code(
            "example.auth0.com", "my-client-id", audience="https://api.example.com"
        )

        call_data = mock_post.call_args[1]["data"]
        assert call_data["audience"] == "https://api.example.com"


class TestPollForToken:
    @patch("cvh_client.auth.time.sleep")
    @patch("cvh_client.auth.httpx.post")
    def test_immediate_success(self, mock_post, mock_sleep, token_response):
        mock_post.return_value = MagicMock(status_code=200, json=lambda: token_response)

        result = poll_for_token("example.auth0.com", "my-client-id", "test-device-code")

        assert result["access_token"] == "test-access-token"

    @patch("cvh_client.auth.time.sleep")
    @patch("cvh_client.auth.httpx.post")
    def test_pending_then_success(self, mock_post, mock_sleep, token_response):
        pending = MagicMock(
            status_code=403,
            json=lambda: {"error": "authorization_pending"},
        )
        success = MagicMock(status_code=200, json=lambda: token_response)
        mock_post.side_effect = [pending, pending, success]

        result = poll_for_token("example.auth0.com", "my-client-id", "test-device-code")

        assert result["access_token"] == "test-access-token"
        assert mock_post.call_count == 3

    @patch("cvh_client.auth.time.sleep")
    @patch("cvh_client.auth.httpx.post")
    def test_access_denied(self, mock_post, mock_sleep):
        mock_post.return_value = MagicMock(
            status_code=403,
            json=lambda: {"error": "access_denied"},
        )

        with pytest.raises(DeviceAuthorizationError, match="denied"):
            poll_for_token("example.auth0.com", "my-client-id", "test-device-code")

    @patch("cvh_client.auth.time.sleep")
    @patch("cvh_client.auth.httpx.post")
    def test_expired_token(self, mock_post, mock_sleep):
        mock_post.return_value = MagicMock(
            status_code=403,
            json=lambda: {"error": "expired_token"},
        )

        with pytest.raises(DeviceAuthorizationError, match="expired"):
            poll_for_token("example.auth0.com", "my-client-id", "test-device-code")


class TestLogin:
    @patch("cvh_client.auth.webbrowser.open")
    @patch("cvh_client.auth.poll_for_token")
    @patch("cvh_client.auth.request_device_code")
    def test_full_flow(
        self,
        mock_request,
        mock_poll,
        mock_browser,
        device_code_response,
        token_response,
        capsys,
    ):
        mock_request.return_value = device_code_response
        mock_poll.return_value = token_response

        result = login("example.auth0.com", "my-client-id")

        assert result["access_token"] == "test-access-token"
        mock_browser.assert_called_once_with(
            device_code_response["verification_uri_complete"]
        )
        output = capsys.readouterr().out
        assert "ABCD-1234" in output

    @patch("cvh_client.auth.webbrowser.open")
    @patch("cvh_client.auth.poll_for_token")
    @patch("cvh_client.auth.request_device_code")
    def test_no_browser(
        self,
        mock_request,
        mock_poll,
        mock_browser,
        device_code_response,
        token_response,
    ):
        mock_request.return_value = device_code_response
        mock_poll.return_value = token_response

        login("example.auth0.com", "my-client-id", open_browser=False)

        mock_browser.assert_not_called()


def _make_jwt(payload: dict) -> str:
    """Build a fake JWT (header.payload.signature) with the given payload."""
    header = base64.urlsafe_b64encode(json.dumps({"alg": "RS256"}).encode()).rstrip(
        b"="
    )
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=")
    signature = base64.urlsafe_b64encode(b"fake-signature").rstrip(b"=")
    return f"{header.decode()}.{body.decode()}.{signature.decode()}"


class TestDecodeTokenPayload:
    def test_decodes_payload(self):
        token = _make_jwt({"sub": "user123", "exp": 9999999999})
        payload = decode_token_payload(token)
        assert payload["sub"] == "user123"
        assert payload["exp"] == 9999999999

    def test_handles_padding(self):
        # Short payload that needs base64 padding
        token = _make_jwt({"a": 1})
        payload = decode_token_payload(token)
        assert payload["a"] == 1


class TestIsTokenExpired:
    def test_valid_token(self):
        token = _make_jwt({"exp": time.time() + 3600})
        assert is_token_expired(token) is False

    def test_expired_token(self):
        token = _make_jwt({"exp": time.time() - 60})
        assert is_token_expired(token) is True

    def test_within_leeway(self):
        # Expires in 10 seconds, but default leeway is 30
        token = _make_jwt({"exp": time.time() + 10})
        assert is_token_expired(token) is True

    def test_custom_leeway(self):
        token = _make_jwt({"exp": time.time() + 10})
        assert is_token_expired(token, leeway=5) is False

    def test_no_exp_claim(self):
        token = _make_jwt({"sub": "user123"})
        assert is_token_expired(token) is True

    def test_invalid_token(self):
        assert is_token_expired("not-a-jwt") is True
