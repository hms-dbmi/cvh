from typing import Any

import requests
from django.contrib.auth.models import User
from environs import env
from jwt import PyJWKClient, decode
from jwt.exceptions import DecodeError
from ninja.errors import HttpError
from ninja.security import HttpBearer

from .models import Project, ProjectMember, VisualizationConf

env.read_env()


class UnauthorizedError(Exception):
    pass


class ForbiddenError(Exception):
    pass


class Authorized(HttpBearer):
    def __init__(self, permissions: list[str] | None = None):
        if permissions is None:
            permissions = []
        self.required_permissions = permissions

    def authenticate(self, _, token):
        token: RequestToken = RequestToken(token)
        if token is None or token.is_authorized() is False:
            raise UnauthorizedError
        if self.required_permissions and not all(
            token.has_permission(p) for p in self.required_permissions
        ):
            raise ForbiddenError

        user = token.get_user()
        return user


class RequestToken:
    def __init__(self, token: str) -> None:
        self._token: str = token

        if token is not None:
            self._decoded: dict[str, Any] | None = self._decode(token)
        else:
            self._decoded = None

    def _decode(self, token: str) -> dict[str, Any] | None:
        domain = env.str("AUTH0_DOMAIN")
        identifier = env.str("AUTH0_IDENTIFIER")

        if domain is None or identifier is None:
            raise HttpError(500, "Error with authentication configuration.")

        signingKey: Any = (
            PyJWKClient(domain + ".well-known/jwks.json")
            .get_signing_key_from_jwt(self._token)
            .key
        )

        if signingKey is None:
            raise HttpError(
                400,
                "Could not retrieve a matching public key for the provided token.",
            )

        try:
            return decode(
                jwt=self._token,
                key=signingKey,
                algorithms=["RS256"],
                audience=identifier,
                issuer=domain,
            )
        except DecodeError:
            raise HttpError(400, "Could not decode the provided token.") from None

    def _get_user_info(self, token: str) -> dict[str, Any] | None:
        domain = env.str("AUTH0_DOMAIN")

        try:
            user_info = requests.get(
                f"{domain}userinfo", headers={"Authorization": f"Bearer {self._token}"}
            )
            return user_info.json()
        except requests.exceptions.HTTPError:
            return None

    def __str__(self) -> str:
        return self._token

    def __getattr__(self, name: str) -> Any:
        return self._decoded[name]

    def get_user(self) -> User:
        try:
            username = self._decoded.get("sub")
            username = username.replace("|", "_")
            user = User.objects.get(username=username)

            if not user.email:
                user_info = self._get_user_info(self._token)
                email = user_info.get("email")
                if email:
                    user.email = email
                    user.save()

        except User.DoesNotExist:
            user_info = self._get_user_info(self._token)
            username = user_info.get("sub")
            email = user_info.get("email")
            if not username or not email:
                return None

            # The format of user_id is
            #    {identity provider id}|{unique id in the provider}
            # The pipe character is invalid for the django username field
            # The solution is to replace the pipe with a dash
            username = username.replace("|", "_")
            user = User(username=username, email=email)
            user.save()

            project = Project.objects.create(
                description="Your first workspace.",
                name="First Workspace",
                user_key=user,
            )
            ProjectMember.objects.create(
                project_key=project, user_key=user, permissions=3
            )

            VisualizationConf.objects.create(
                project_key=project, name="Visualization 1"
            )

        return user

    def has_permission(self, permission: str) -> bool:
        return permission in self._decoded["permissions"]

    def clear(self) -> None:
        self._decoded = None

    def is_authorized(self) -> bool:
        return self._decoded is not None

    def dict(self) -> dict[str, Any]:
        return self._decoded if self._decoded is not None else {}
