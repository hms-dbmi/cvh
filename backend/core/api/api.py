from ninja import NinjaAPI, Query, Schema, Field
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Q, F

from django.http import Http404

from ninja.security import HttpBearer
from ninja.errors import HttpError
from ninja.pagination import paginate, PageNumberPagination

from jwt import PyJWKClient, decode
from jwt.exceptions import DecodeError
from typing import Any, List
from environs import env
import requests

from .models import Project, Dataset, VisualizationConf, ProjectMember, Tag
from .schema import (
    ProjectIn,
    ProjectOut,
    DatasetIn,
    DatasetOut,
    DatasetUpdate,
    VisualizationNoConfOut,
    VisualizationIn,
    VisualizationOut,
    PartialVisualizationUpdate,
    ProjectMemberIn,
    ProjectMemberOut,
    TagIn,
    TagOut,
    VizTagIn,
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
            email = user_info.get("email")
            # username = user_info.get("sub")
            if not username:
                return None

            # The format of user_id is
            #    {identity provider id}|{unique id in the provider}
            # The pipe character is invalid for the django username field
            # The solution is to replace the pipe with a dash
            username = username.replace("|", "_")
            user = User(username=username, email=email)
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


def _get_project(project_uuid: str, user: User, error_message: str):
    try:
        project = Project.objects.get(uuid=project_uuid, private=False)
    except Project.DoesNotExist:
        try:
            project = Project.objects.get_read_project(
                user=user, project_uuid=project_uuid
            )
        except Project.DoesNotExist:
            raise Http404(error_message)
    return project


@api.post("/projects/members", auth=Authorized())
def add_project_member(request, member: ProjectMemberIn):
    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=member.project_uuid
    )
    user = get_object_or_404(User, email=member.email)
    ProjectMember.objects.create(project_key=project, user_key=user, permissions=1)
    return {"success": True}


@api.get(
    "/projects/members/{project_uuid}",
    auth=Authorized(),
    response=List[ProjectMemberOut],
)
def get_project_members(request, project_uuid: str):
    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=project_uuid
    )
    project_members = ProjectMember.objects.filter(project_key=project).values(
        "permissions", email=F("user_key__email")
    )
    return project_members


@api.post("/projects", auth=Authorized(), response={201: ProjectOut})
def create_project(request, project: ProjectIn):
    user_key = {"user_key": request.auth}
    p = Project.objects.create(**project.dict(), **user_key)
    ProjectMember.objects.create(project_key=p, user_key=request.auth, permissions=4)
    return p


@api.get("/projects", auth=Authorized(), response=List[ProjectOut])
@paginate
def get_projects(request):
    projects = (
        Project.objects.get_read_projects(user=request.auth)
        .order_by("-modified_timestamp")
        .values()
    )
    return projects


@api.get("/public/projects", auth=Authorized(), response=List[ProjectOut])
@paginate
def get_public_projects(request):
    projects = (
        Project.objects.filter(private=False).order_by("-modified_timestamp").values()
    )
    return projects


@api.get("/projects/{project_uuid}", auth=Authorized(), response=ProjectOut)
def get_project(request, project_uuid: str):
    project = _get_project(
        user=request.auth, project_uuid=project_uuid, error_message="Project not found."
    )
    permissions = None
    try:
        permissions = ProjectMember.objects.get(project_key=project, user_key=request.auth).permissions
    except ProjectMember.DoesNotExist:
        pass
    return {**project.__dict__, "permissions": permissions}


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


@api.put("/datasets", auth=Authorized())
def update_dataset(request, payload: DatasetUpdate):
    payload_dict = payload.dict(exclude_unset=True)
    if payload.project_uuid:
        project = Project.objects.get_write_project(
            project_uuid=payload.project_uuid, user=request.auth
        )
        dataset = get_object_or_404(Dataset, uuid=payload.uuid, project_key=project)
        del payload_dict["project_uuid"]
    else:
        dataset = get_object_or_404(Dataset, uuid=payload.uuid, user_key=request.auth)

    del payload_dict["uuid"]
    for attr, value in payload_dict.items():
        setattr(dataset, attr, value)
    dataset.save()
    return {"success": True}


@api.put("/datasets/tags", auth=Authorized())
def tag_dataset(request, payload: TagIn):
    if payload.project_uuid:
        project = Project.objects.get_write_project(
            project_uuid=payload.project_uuid, user=request.auth
        )
        dataset = get_object_or_404(Dataset, uuid=payload.uuid, project_key=project)
    else:
        dataset = get_object_or_404(Dataset, uuid=payload.uuid, user_key=request.auth)
    try:
        tag = Tag.objects.get(tag=payload.tag, key=payload.key)
    except Tag.DoesNotExist:
        tag = Tag.objects.create(tag=payload.tag, key=payload.key)
    dataset.tags.add(tag)
    return {"success": True}


@api.get("/datasets", auth=Authorized(), response=List[DatasetOut])
@paginate
def get_user_datasets(request):
    datasets = Dataset.objects.filter(user_key=request.auth).values(
        "source_url",
        "file_type",
        "data_type",
        "uuid",
        "name",
        "description",
        "created_timestamp",
        "modified_timestamp",
        "last_viewed_timestamp",
        "combined_tags",
    )
    return datasets


class QuerySchema(Schema):
    tags: List[str] = Field(None, alias="tags")


@api.get("/datasets/{project_uuid}", auth=Authorized(), response=List[DatasetOut])
@paginate(PageNumberPagination)
def get_project_datasets(
    request, project_uuid: str, query_filters: QuerySchema = Query(...)
):
    project = _get_project(
        user=request.auth, project_uuid=project_uuid, error_message="Dataset not found."
    )
    q = Q()
    if query_filters.tags:
        t = Tag.objects.filter(tag__in=query_filters.tags)
        q &= Q(tags__in=t)
    datasets = (
        Dataset.objects.filter(Q(project_key=project) & q)
        .order_by("-modified_timestamp")
        .values(
            "source_url",
            "file_type",
            "data_type",
            "uuid",
            "name",
            "description",
            "created_timestamp",
            "modified_timestamp",
            "last_viewed_timestamp",
            "combined_tags",
        )
    )
    return datasets


@api.get("/tags", response=List[TagOut])
@paginate
def get_tags(request, sub_str: str = None):
    q = Q()
    if sub_str:
        q &= Q(tag__icontains=sub_str)

    tags = Tag.objects.filter(q)
    return tags


@api.get("/public/visualizations", response=List[VisualizationNoConfOut])
@paginate
def get_published_visualizations(request, query_filters: QuerySchema = Query(...)):
    q = Q()
    if query_filters.tags:
        t = Tag.objects.filter(tag__in=query_filters.tags)
        q &= Q(tags__in=t)
    visualizations = (
        VisualizationConf.objects.filter(Q(published=True) & q)
        .order_by("-modified_timestamp")
        .values()
    )
    return visualizations


@api.get("/visualizations", auth=Authorized(), response=List[VisualizationNoConfOut])
def get_project_visualizations(
    request, project_uuid: str, query_filters: QuerySchema = Query(...)
):
    q = Q()
    if query_filters.tags:
        t = Tag.objects.filter(tag__in=query_filters.tags)
        q &= Q(tags__in=t)
    project = _get_project(
        user=request.auth,
        project_uuid=project_uuid,
        error_message="Visualization not found.",
    )
    visualizations = VisualizationConf.objects.filter(Q(project_key=project) & q)
    return visualizations


@api.get("/visualizations/{visualization_uuid}", response=VisualizationOut)
def get_visualization(request, visualization_uuid: str):
    visualization = get_object_or_404(VisualizationConf, uuid=visualization_uuid)
    return visualization


@api.delete("/visualizations/{visualization_uuid}", auth=Authorized())
def delete_visualization(request, visualization_uuid: str):
    visualization = get_object_or_404(VisualizationConf, uuid=visualization_uuid)
    try:
        Project.objects.get_write_project(
            project_uuid=visualization.project_key.uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Failed to delete visualization.")

    visualization.delete()
    return {"success": True}


@api.put("/visualizations/{visualization_uuid}", auth=Authorized())
def update_visualization(
    request, visualization_uuid: str, payload: PartialVisualizationUpdate
):
    payload_dict = payload.dict(exclude_unset=True)
    visualization = get_object_or_404(VisualizationConf, uuid=visualization_uuid)
    try:
        Project.objects.get_write_project(
            project_uuid=visualization.project_key.uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Failed to update visualization.")

    for attr, value in payload_dict.items():
        setattr(visualization, attr, value)
    visualization.save()
    return {"success": True}


@api.put("/visualizations/{visualization_uuid}/tags", auth=Authorized())
def tag_visualization(request, visualization_uuid: str, payload: VizTagIn):
    visualization = get_object_or_404(VisualizationConf, uuid=visualization_uuid)
    try:
        Project.objects.get_write_project(
            project_uuid=visualization.project_key.uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Failed to tag visualization.")
    try:
        tag = Tag.objects.get(tag=payload.tag, key=payload.key)
    except Tag.DoesNotExist:
        tag = Tag.objects.create(tag=payload.tag, key=payload.key)
    visualization.tags.add(tag)
    return {"success": True}


@api.post("/visualizations", auth=Authorized(), response={201: VisualizationIn})
def create_visualization(request, visualization: VisualizationIn):
    visualization_dict = visualization.dict()
    project_uuid = visualization_dict.get("project_uuid")
    del visualization_dict["project_uuid"]

    project = get_object_or_404(
        Project, Q(uuid=project_uuid) & (Q(user_key=request.auth) | Q(private=False))
    )
    VisualizationConf.objects.create(**visualization_dict, project_key=project)
    return visualization
