from ninja import NinjaAPI
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Q

from ninja.security import HttpBearer
from ninja.errors import HttpError
from ninja.pagination import paginate

from jwt import PyJWKClient, decode
from jwt.exceptions import DecodeError
from typing import Any, List
from environs import env
import requests

from .models import Project, Dataset, VisualizationConf
from .schema import (
    ProjectIn,
    ProjectOut,
    DatasetIn,
    DatasetOut,
    VisualizationNoConfOut,
    VisualizationIn,
    VisualizationOut,
)

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
        if self.required_permissions and not all(
            token.hasPermission(p) for p in self.required_permissions
        ):
            raise ForbiddenError

        user = token.get_user()
        print(user)
        return user


class RequestToken(object):
    def __init__(self, token: str) -> None:
        self._token: str = token

        if token is not None:
            self._decoded: dict[str, Any] | None = self.__decode__(token)
        else:
            self._decoded = None

    def __decode__(self, token: str) -> dict[str, Any] | None:
        env.read_env()
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
            raise HttpError(400, "Could not decode the provided token.")

    def __get_user_info__(self, token: str) -> dict[str, Any] | None:
        env.read_env()
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
        except User.DoesNotExist:
            user_info = self.__get_user_info__(self._token)
            username = user_info.get("sub")
            if not username:
                return None

            # The format of user_id is
            #    {identity provider id}|{unique id in the provider}
            # The pipe character is invalid for the django username field
            # The solution is to replace the pipe with a dash
            username = username.replace("|", "_")
            user = User(username=username)
            user.save()

        return user

    def hasPermission(self, permission: str) -> bool:
        return permission in self._decoded["permissions"]

    def clear(self) -> None:
        self._decoded = None

    def isAuthorized(self) -> bool:
        return self._decoded is not None

    def dict(self) -> dict[str, Any]:
        return self._decoded if self._decoded is not None else {}


@api.post("/projects", auth=Authorized(), response={201: ProjectOut})
def create_project(request, project: ProjectIn):
    user_key = {"user_key": request.auth}
    Project.objects.create(**project.dict(), **user_key)
    return project


@api.get("/projects", auth=Authorized(), response=List[ProjectOut])
@paginate
def get_projects(request):
    projects = Project.objects.filter(user_key=request.auth).order_by('-modified_timestamp').values()
    return projects

@api.get("/public/projects", auth=Authorized(), response=List[ProjectOut])
@paginate
def get_public_projects(request):
    projects = Project.objects.filter(private=False,).exclude(user_key=request.auth).order_by('-modified_timestamp').values()
    return projects


@api.get("/projects/{project_uuid}", auth=Authorized(), response=ProjectOut)
def get_project(request, project_uuid: str):
    project = get_object_or_404(Project, Q(uuid=project_uuid) & (Q(user_key=request.auth) | Q(private=False)))
    return project


@api.post("/datasets", auth=Authorized(), response={201: DatasetIn})
def create_dataset(request, dataset: DatasetIn):
    dataset_dict = dataset.dict()
    project_uuid = dataset_dict.get("project_uuid")
    del dataset_dict["project_uuid"]
    if project_uuid:
        project = get_object_or_404(Project, uuid=project_uuid, user_key=request.auth)
        Dataset.objects.create(**dataset_dict, project_key=project)
        return dataset
    Dataset.objects.create(**dataset_dict, user_key=request.auth)
    return dataset


@api.get("/datasets", auth=Authorized(), response=List[DatasetOut])
@paginate
def get_user_datasets(request):
    datasets = Dataset.objects.filter(user_key=request.auth)
    return datasets


# TODO: Convert to search param for project_uuid.
@api.get("/datasets/{project_uuid}", auth=Authorized(), response=List[DatasetOut])
def get_project_datasets(request, project_uuid: str):
    project = get_object_or_404(Project, Q(uuid=project_uuid) & (Q(user_key=request.auth) | Q(private=False)))
    datasets = Dataset.objects.filter(project_key=project)
    return datasets


@api.get("/visualizations", auth=Authorized(), response=List[VisualizationNoConfOut])
def get_project_visualizations(request, project_uuid: str):
    project = get_object_or_404(Project, Q(uuid=project_uuid) & (Q(user_key=request.auth) | Q(private=False)))
    visualizations = VisualizationConf.objects.filter(project_key=project)
    return visualizations


@api.get("/visualizations/{visualization_uuid}", auth=Authorized(), response=VisualizationOut)
def get_visualization(request, visualization_uuid: str):
    visualization = get_object_or_404(VisualizationConf, uuid=visualization_uuid)
    return visualization


@api.post("/visualizations", auth=Authorized(), response={201: VisualizationIn})
def create_visualization(request, visualization: VisualizationIn):
    visualization_dict = visualization.dict()
    project_uuid = visualization_dict.get("project_uuid")
    del visualization_dict["project_uuid"]

    project = get_object_or_404(Project, Q(uuid=project_uuid) & (Q(user_key=request.auth) | Q(private=False)))
    VisualizationConf.objects.create(**visualization_dict, project_key=project)
    return visualization
