"""Auth0-backed OIDC backend for the Django admin.

The Django admin SERVICE_VARIANT routes unauthenticated users through the
Auth0 OIDC flow. This backend gates that flow on a custom role claim that
an Auth0 Action injects from the user's `app_metadata.roles` — only users
with `OIDC_ADMIN_ROLE_NAME` in their roles array are allowed to log in,
and they're upserted as Django superusers on success.

Auth0 Action (Login flow → Post Login) — drop this in to populate the
claim that this backend reads:

    exports.onExecutePostLogin = async (event, api) => {
      const namespace = process.env.CVH_CLAIM_NAMESPACE; // e.g. "https://cvh/"
      const roles =
        (event.user.app_metadata && event.user.app_metadata.roles) || [];
      api.idToken.setCustomClaim(`${namespace}roles`, roles);
    };

Granting access in Auth0: edit the user's `app_metadata` to include
`{"roles": ["cvh_admin"]}` (or whatever `OIDC_ADMIN_ROLE_NAME` is set to).
"""

from django.conf import settings
from mozilla_django_oidc.auth import OIDCAuthenticationBackend


class Auth0AdminOIDCBackend(OIDCAuthenticationBackend):
    def verify_claims(self, claims: dict) -> bool:
        if not super().verify_claims(claims):
            return False
        roles = claims.get(settings.OIDC_ADMIN_ROLE_CLAIM) or []
        return settings.OIDC_ADMIN_ROLE_NAME in roles

    def create_user(self, claims: dict):
        user = super().create_user(claims)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return user

    def update_user(self, user, claims: dict):
        # Re-sync the admin flags on every login so a role removed in
        # Auth0 takes effect immediately on next sign-in. (verify_claims
        # already rejects users without the role, so reaching here means
        # the role is still present.)
        user = super().update_user(user, claims)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return user
