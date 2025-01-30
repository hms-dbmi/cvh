from ninja import NinjaAPI

from ninja.security import HttpBearer
from ninja.errors import HttpError

from jwt import PyJWKClient, decode
from jwt.exceptions import DecodeError
from typing import Any
from environs import env


api = NinjaAPI()
class UnauthorizedError(Exception):
    pass


@api.exception_handler(UnauthorizedError)
def unauthorized_exception(request, _):
    return api.create_response(
        request,
        {"message": "Unauthorized."},
        status=401,
    )

class ForbiddenError(Exception):
    pass

@api.exception_handler(UnauthorizedError)
def forbidden_exception(request, _):
    return api.create_response(
        request,
        {"message": "Forbidden."},
        status=403,
    )


class Authorized(HttpBearer):
    def __init__(self, permissions: list[str] | None = []):
        self.required_permissions = permissions

    def authenticate(self, _, token):
        token: RequestToken = RequestToken(token)
        if token is None or token.isAuthorized() is False:
            raise UnauthorizedError
        if self.required_permissions and not all(token.hasPermission(p) for p in self.required_permissions):
            raise ForbiddenError
        return token


class RequestToken(object):
    def __init__(self, token: str) -> None:
        self._token: str = token

        if token is not None:
            self._decoded: dict[str, Any] | None = self.__decode__(token)
        else:
            self._decoded = None

    def __decode__(self, token: str) -> dict[str, Any] | None:
        env.read_env()
        domain = env.str('AUTH0_DOMAIN')
        identifier = env.str('AUTH0_API_IDENTIFIER')

        if domain is None or identifier is None:
            raise HttpError(500, "Error with authentication configuration.")


        issuer: str = "https://{}/".format(domain)

        signingKey: Any = (
            PyJWKClient(issuer + ".well-known/jwks.json")
            .get_signing_key_from_jwt(self._token)
            .key
        )

        if signingKey is None:
            raise HttpError(400,
                "Could not retrieve a matching public key for the provided token.", 
            )

        try:
            return decode(
                jwt=self._token,
                key=signingKey,
                algorithms=["RS256"],
                audience=identifier,
                issuer=issuer,
            )
        except DecodeError:
            raise HttpError(400, "Could not decode the provided token.")

    def __str__(self) -> str:
        return self._token

    def __getattr__(self, name: str) -> Any:
        return self._decoded[name]

    def hasPermission(self, permission: str) -> bool:
        return permission in self._decoded["permissions"]

    def clear(self) -> None:
        self._decoded = None

    def isAuthorized(self) -> bool:
        return self._decoded is not None

    def dict(self) -> dict[str, Any]:
        return self._decoded if self._decoded is not None else {}


@api.get("/hello")
def hello(request):
    return "Hello world"

@api.get("/secure", auth=Authorized())
def secure(request):
    return "Hello secure world"