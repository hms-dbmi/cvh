"""Exceptions raised by the CVH client.

All errors inherit from `CVHError`. Catch the specific subclass when
you know what to do about it (e.g., surface a friendly message on
`NotFoundError`), or catch `CVHError` at the top of a script to log
and abort on anything unexpected.

Hierarchy::

    CVHError
    └── CVHAPIError               # server returned non-2xx
        ├── NotFoundError         # 404
        └── AuthorizationError    # 401 / 403
"""

from __future__ import annotations

import httpx


class CVHError(Exception):
    """Base exception for all cvh-client errors.

    Includes both API errors (subclasses of `CVHAPIError`) and
    client-side problems like malformed / empty responses.

    Example:
        try:
            client.get_dataset(uuid)
        except CVHError as e:
            print(f"Something went wrong: {e}")
    """


class CVHAPIError(CVHError):
    """Raised when the CVH API returns a non-2xx HTTP response.

    Attributes:
        status_code: HTTP status code.
        method: HTTP verb of the request (GET/POST/PUT/DELETE).
        url: Full URL that was hit.
        detail: Parsed response body — a dict if the response was
            JSON (typically `{"detail": "..."}` from the backend), or
            the raw text if not JSON.

    Example:
        try:
            client.update_dataset(uuid, name="new")
        except CVHAPIError as e:
            print(f"API error {e.status_code}: {e.detail}")
    """

    def __init__(self, response: httpx.Response):
        self.status_code = response.status_code
        self.method = response.request.method
        self.url = str(response.request.url)
        try:
            self.detail = response.json()
        except Exception:
            self.detail = response.text

        message = f"{self.method} {self.url} returned {self.status_code}"
        if isinstance(self.detail, dict) and "detail" in self.detail:
            message += f": {self.detail['detail']}"
        elif isinstance(self.detail, str) and self.detail:
            message += f": {self.detail}"
        super().__init__(message)


class NotFoundError(CVHAPIError):
    """Raised for HTTP 404 responses.

    Common causes:
    - The UUID doesn't exist (typo or the resource was deleted).
    - The authenticated user lacks read access. The backend returns
      404 rather than 403 in this case for privacy, so you can't tell
      the two apart from the response alone.

    Example:
        try:
            ds = client.get_dataset(uuid)
        except NotFoundError:
            print("Not found — either it doesn't exist or you don't have access.")
    """


class AuthorizationError(CVHAPIError):
    """Raised for HTTP 401 (unauthenticated) or 403 (forbidden) responses.

    - 401 typically means the access token is missing, malformed, or
      expired — `CVHClient` auto-refreshes when possible, so this
      usually indicates a config problem rather than a stale token.
    - 403 means the user is authenticated but lacks permission for
      the requested action (e.g., a read-only member trying to write).

    Example:
        try:
            client.update_workspace(uuid, name="new")
        except AuthorizationError:
            print("You don't have permission to modify this workspace.")
    """
