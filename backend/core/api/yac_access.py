"""Grant and remove the YAC users role through Auth0's Management API.

The admin service calls these when an admin approves or revokes a YAC access
request. Auth0 is what enforces access: YAC refuses tokens to anyone without
the role.
"""

from urllib.parse import quote

import requests
from django.conf import settings
from django.core.cache import cache

TOKEN_CACHE_KEY = "auth0-management-token"


class Auth0ManagementError(Exception):
    pass


def _token() -> str:
    if token := cache.get(TOKEN_CACHE_KEY):
        return token
    if not (settings.AUTH0_MGMT_CLIENT_ID and settings.AUTH0_MGMT_CLIENT_SECRET):
        raise Auth0ManagementError("AUTH0_MGMT_CLIENT_ID and _SECRET aren't set.")
    response = requests.post(
        f"{settings.AUTH0_DOMAIN}oauth/token",
        json={
            "grant_type": "client_credentials",
            "client_id": settings.AUTH0_MGMT_CLIENT_ID,
            "client_secret": settings.AUTH0_MGMT_CLIENT_SECRET,
            "audience": f"{settings.AUTH0_DOMAIN}api/v2/",
        },
        timeout=10,
    )
    if not response.ok:
        raise Auth0ManagementError(
            f"Auth0 token request failed ({response.status_code})."
        )
    body = response.json()
    # Renew a minute early so a request never carries an expiring token.
    cache.set(TOKEN_CACHE_KEY, body["access_token"], body["expires_in"] - 60)
    return body["access_token"]


def _change_role(method: str, auth0_user_id: str) -> None:
    if not settings.YAC_AUTH0_ROLE_ID:
        raise Auth0ManagementError("YAC_AUTH0_ROLE_ID isn't set.")
    response = requests.request(
        method,
        f"{settings.AUTH0_DOMAIN}api/v2/users/{quote(auth0_user_id, safe='')}/roles",
        json={"roles": [settings.YAC_AUTH0_ROLE_ID]},
        headers={"Authorization": f"Bearer {_token()}"},
        timeout=10,
    )
    if not response.ok:
        if response.status_code in (401, 403):
            # Scopes or the secret may have been fixed since; don't keep
            # sending the old token for the rest of its day.
            cache.delete(TOKEN_CACHE_KEY)
        raise Auth0ManagementError(
            f"Auth0 refused the role change ({response.status_code})."
        )


def _change_role_or_report(method: str, auth0_user_id: str) -> None:
    try:
        _change_role(method, auth0_user_id)
    except requests.RequestException as error:
        # A timeout or DNS failure would otherwise show the admin a 500 page.
        raise Auth0ManagementError(
            f"Couldn't reach Auth0 ({type(error).__name__})."
        ) from error


def grant_yac_role(auth0_user_id: str) -> None:
    _change_role_or_report("POST", auth0_user_id)


def remove_yac_role(auth0_user_id: str) -> None:
    _change_role_or_report("DELETE", auth0_user_id)
