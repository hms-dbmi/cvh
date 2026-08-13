"""Auth0 device authorization flow for retrieving API tokens.

Uses the OAuth 2.0 Device Authorization Grant, which is well-suited for
CLI and Jupyter notebook contexts: it opens a browser for login and polls
for the token in the background.

Reference: https://auth0.com/blog/securing-a-python-cli-application-with-auth0/
"""

from __future__ import annotations

import base64
import json
import time
import webbrowser

import httpx


class DeviceAuthorizationError(Exception):
    """Raised when device authorization fails."""


class TokenExpiredError(Exception):
    """Raised when the access token has expired."""


def decode_token_payload(token: str) -> dict:
    """Decode a JWT payload without signature verification.

    This is intentionally insecure — it only reads the claims to check
    expiration. Actual token validation happens server-side.
    """
    payload_segment = token.split(".")[1]
    # Add padding — base64url omits trailing '='
    padding = 4 - len(payload_segment) % 4
    if padding != 4:
        payload_segment += "=" * padding
    return json.loads(base64.urlsafe_b64decode(payload_segment))


def is_token_expired(token: str, leeway: int = 30) -> bool:
    """Check whether a JWT access token has expired.

    Args:
        token: The JWT access token string.
        leeway: Seconds of buffer before actual expiry to consider it expired.
            Defaults to 30s to avoid races with in-flight requests.

    Returns:
        True if the token is expired (or has no exp claim), False otherwise.
    """
    try:
        payload = decode_token_payload(token)
    except Exception:
        return True
    exp = payload.get("exp")
    if exp is None:
        return True
    return time.time() >= (exp - leeway)


def request_device_code(
    domain: str,
    client_id: str,
    scope: str = "openid profile email",
    audience: str | None = None,
) -> dict:
    """Request a device code from Auth0.

    Returns a dict with keys: device_code, user_code, verification_uri,
    verification_uri_complete, expires_in, interval.
    """
    payload: dict[str, str] = {
        "client_id": client_id,
        "scope": scope,
    }
    if audience:
        payload["audience"] = audience

    response = httpx.post(
        f"https://{domain}/oauth/device/code",
        data=payload,
    )
    response.raise_for_status()
    return response.json()


def poll_for_token(
    domain: str,
    client_id: str,
    device_code: str,
    interval: int = 5,
    expires_in: int = 900,
) -> dict:
    """Poll Auth0's token endpoint until the user authorizes or the code expires.

    Returns the token response dict with keys: access_token, token_type, etc.
    """
    token_url = f"https://{domain}/oauth/token"
    payload = {
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        "device_code": device_code,
        "client_id": client_id,
    }

    deadline = time.monotonic() + expires_in

    while time.monotonic() < deadline:
        time.sleep(interval)

        response = httpx.post(token_url, data=payload)
        data = response.json()

        if response.status_code == 200:
            return data

        error = data.get("error")
        if error == "authorization_pending":
            continue
        elif error == "slow_down":
            interval += 5
        elif error == "expired_token":
            raise DeviceAuthorizationError("Device code expired. Please try again.")
        elif error == "access_denied":
            raise DeviceAuthorizationError("Authorization was denied by the user.")
        else:
            raise DeviceAuthorizationError(
                f"Unexpected error: {error} - {data.get('error_description', '')}"
            )

    raise DeviceAuthorizationError("Device code expired (timeout). Please try again.")


def login(
    domain: str,
    client_id: str,
    scope: str = "openid profile email",
    audience: str | None = None,
    open_browser: bool = True,
) -> dict:
    """Run the full device authorization flow.

    1. Requests a device code from Auth0
    2. Displays the verification URL and user code
    3. Optionally opens the browser for the user
    4. Polls until the user completes authorization

    Returns the token response dict containing access_token, id_token, etc.
    """
    device_data = request_device_code(
        domain=domain,
        client_id=client_id,
        scope=scope,
        audience=audience,
    )

    verification_uri_complete = device_data.get("verification_uri_complete")
    verification_uri = device_data["verification_uri"]
    user_code = device_data["user_code"]

    print(f"\n1. Open this URL in your browser: {verification_uri}")
    print(f"2. Enter the code: {user_code}\n")

    if open_browser and verification_uri_complete:
        webbrowser.open(verification_uri_complete)
    elif open_browser:
        webbrowser.open(verification_uri)

    print("Waiting for authorization...")

    token_data = poll_for_token(
        domain=domain,
        client_id=client_id,
        device_code=device_data["device_code"],
        interval=device_data.get("interval", 5),
        expires_in=device_data.get("expires_in", 900),
    )

    print("Successfully authenticated!")
    return token_data
