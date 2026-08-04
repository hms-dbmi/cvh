"""Exceptions for the CVH client."""

from __future__ import annotations

import httpx


class CVHError(Exception):
    """Base exception for CVH client errors."""


class CVHAPIError(CVHError):
    """Raised when the CVH API returns an error response."""

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
    """Raised when a resource is not found (404)."""


class AuthorizationError(CVHAPIError):
    """Raised on 401/403 responses."""
