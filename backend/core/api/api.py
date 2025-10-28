from ninja import NinjaAPI, Query, Schema, Field
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Q, F, Value, CharField, Count
from django.core.exceptions import PermissionDenied
from django.db.models.functions import Concat
from django.forms.models import model_to_dict
from django.utils import timezone
from django.http import Http404

from ninja.security import HttpBearer
from ninja.errors import HttpError
from ninja.pagination import paginate, PageNumberPagination

from jwt import PyJWKClient, decode
from jwt.exceptions import DecodeError
from typing import Any, List, Literal
from environs import env
import requests

from .models import Project, Dataset, VisualizationConf, ProjectMember, Tag
from .schema import (
    UserOut,
    UserIn,
    ProjectIn,
    ProjectOut,
    ProjectOutWithMembersCount,
    DatasetIn,
    DatasetOut,
    DatasetUpdate,
    DatasetWithTagsOut,
    VisualizationNoConfOut,
    VisualizationIn,
    VisualizationOut,
    PartialVisualizationUpdate,
    ProjectMemberIn,
    ProjectMemberOut,
    ProjectMemberUpdate,
    PartialProjectIn,
    TagsIn,
    TagOut,
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

            if not user.email:
                user_info = self.__get_user_info__(self._token)
                email = user_info.get("email")
                if email:
                    setattr(user, "email", email)
                    user.save()

        except User.DoesNotExist:
            user_info = self.__get_user_info__(self._token)
            username = user_info.get("sub")
            email = user_info.get("email")
            # username = user_info.get("sub")
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
                project_key=project, user_key=user, permissions=4
            )

        return user

    def hasPermission(self, permission: str) -> bool:
        return permission in self._decoded["permissions"]

    def clear(self) -> None:
        self._decoded = None

    def isAuthorized(self) -> bool:
        return self._decoded is not None

    def dict(self) -> dict[str, Any]:
        return self._decoded if self._decoded is not None else {}


@api.get("/user", auth=Authorized(), response=UserOut)
def get_user_info(request):
    return get_object_or_404(User, username=request.auth)

@api.put("/user", auth=Authorized())
def update_user_info(request, user_in: UserIn):
    user = get_object_or_404(User, username=request.auth)
    user_dict = user_in.dict(exclude_unset=True)

    for attr, value in user_dict.items():
        setattr(user, attr, value)
    user.save()
    return {"success": True}


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


@api.put("/projects/members", auth=Authorized())
def update_project_member(request, member: ProjectMemberUpdate):
    member_dict = member.dict(exclude_unset=True)

    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=member.project_uuid
    )
    project_member = get_object_or_404(
        ProjectMember, user_key__email=member.email, project_key=project
    )

    del member_dict["project_uuid"]
    for attr, value in member_dict.items():
        setattr(project_member, attr, value)
    project_member.save()
    return {"success": True}


@api.delete("/projects/members", auth=Authorized())
def delete_project_member(request, member: ProjectMemberIn):
    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=member.project_uuid
    )
    project_member = get_object_or_404(
        ProjectMember, user_key__email=member.email, project_key=project
    )

    if project_member.permissions >= 4:
        raise PermissionDenied()
    project_member.delete()
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


@api.post("/projects", auth=Authorized(), response={201: ProjectIn})
def create_project(request, project: ProjectIn):
    user_key = {"user_key": request.auth}
    p = Project.objects.create(**project.dict(), **user_key)
    ProjectMember.objects.create(project_key=p, user_key=request.auth, permissions=4)
    return p


@api.get("/projects", auth=Authorized(), response=List[ProjectOutWithMembersCount])
@paginate
def get_projects(request):
    projects = (
        Project.objects.get_read_projects(user=request.auth)
        .filter(private=True)
        .order_by("-modified_timestamp")
        .values()
        .annotate(project_members_count=Count("projectmember", distinct=True))
    )
    return projects


@api.delete("/projects/{project_uuid}", auth=Authorized())
def delete_project(request, project_uuid: str):
    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=project_uuid
    )
    project.delete()
    return {"success": True}


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
        permissions = ProjectMember.objects.get(
            project_key=project, user_key=request.auth
        ).permissions
    except ProjectMember.DoesNotExist:
        pass
    return {**project.__dict__, "permissions": permissions}


@api.put("/projects/{project_uuid}", auth=Authorized())
def update_project(request, project_uuid: str, payload: PartialProjectIn):
    payload_dict = payload.dict(exclude_unset=True)
    project = Project.objects.get_admin_project(
        project_uuid=project_uuid, user=request.auth
    )
    for attr, value in payload_dict.items():
        setattr(project, attr, value)
    project.save()
    return {"success": True}


@api.post("/datasets", auth=Authorized(), response={201: DatasetIn})
def create_dataset(request, dataset: DatasetIn):
    dataset_dict = dataset.dict()
    project_uuid = dataset_dict.get("project_uuid")
    del dataset_dict["project_uuid"]

    if project_uuid:
        try:
            project = Project.objects.get_write_project(
                user=request.auth, project_uuid=project_uuid
            )
            Dataset.objects.create(**dataset_dict["dataset"], project_key=project)
            return dataset
        except Project.DoesNotExist:
            raise Http404("Failed to create visualization.")
    Dataset.objects.create(**dataset_dict.dataset, user_key=request.auth)
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
def tag_dataset(request, payload: TagsIn):
    try:
        project = Project.objects.get_write_project(
            project_uuid=payload.project_uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Failed to tag dataset.")

    dataset = get_object_or_404(Dataset, uuid=payload.uuid, project_key=project)

    tags = []
    for t in payload.tags:
        try:
            tag = Tag.objects.get(tag=t["tag"], key=t["key"], project_key=project)
        except Tag.DoesNotExist:
            tag = Tag.objects.create(tag=t["tag"], key=t["key"], project_key=project)
        tags.append(tag)

    dataset.tags.set(tags)
    return {"success": True}


@api.get("/datasets", auth=Authorized(), response=List[DatasetOut])
@paginate
def get_user_datasets(request):
    datasets = Dataset.objects.filter(user_key=request.auth)
    return datasets


class DatasetQuerySchema(Schema):
    tags: List[str] = Field(None, alias="tags")
    assembly: List[str] = Field(None, alias="assembly")
    file_type: List[str] = Field(None, alias="file_type")
    name: str = Field(None, alias="name")


@api.get(
    "/datasets/{project_uuid}", auth=Authorized(), response=List[DatasetWithTagsOut]
)
@paginate(PageNumberPagination)
def get_project_datasets(
    request, project_uuid: str, query_filters: DatasetQuerySchema = Query(...)
):
    project = _get_project(
        user=request.auth, project_uuid=project_uuid, error_message="Dataset not found."
    )
    q = Q()
    if query_filters.tags:
        t = Tag.objects.filter(uuid__in=query_filters.tags)
        q &= Q(tags__in=t)
    if query_filters.assembly:
        q &= Q(assembly__in=query_filters.assembly)
    if query_filters.file_type:
        q &= Q(file_type__in=query_filters.file_type)
    if query_filters.name:
        q &= Q(name__icontains=query_filters.name)
    datasets = (
        Dataset.objects.filter(Q(project_key=project) & q)
        .order_by("-modified_timestamp")
        .distinct()
    )

    return datasets


@api.get("/datasets/fields/{project_uuid}", auth=Authorized(), response=List[str])
def get_project_datasets_field_values(
    request, project_uuid: str, field: Literal["assembly", "file_type"]
):
    project = Project.objects.get_read_project(
        user=request.auth, project_uuid=project_uuid
    )
    field_values = (
        Dataset.objects.filter(Q(project_key=project))
        .values_list(field, flat="true")
        .distinct()
    )
    return field_values


@api.get("/datasets/tags/{project_uuid}", auth=Authorized(), response=List[TagOut])
def get_project_datasets_tags(request, project_uuid: str):
    project = Project.objects.get_read_project(
        user=request.auth, project_uuid=project_uuid
    )
    field_values = (
        Dataset.objects.filter(Q(project_key=project))
        .values("tags__tag", "tags__uuid", "tags__key", "tags__uuid")
        .distinct()
        .exclude(tags__uuid=None)
    )

    tags = [
        dict(tag=item["tags__tag"], key=item["tags__key"], uuid=item["tags__uuid"])
        for item in field_values
    ]

    return tags


@api.get(
    "/datasets/uuid/{dataset_uuid}", auth=Authorized(), response=DatasetWithTagsOut
)
def get_dataset(request, dataset_uuid: str):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        Project.objects.get_read_project(
            project_uuid=dataset.project_key.uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Dataset not found.")

    return dataset


@api.delete("/datasets/uuid/{dataset_uuid}", auth=Authorized())
def delete_dataset(request, dataset_uuid: str):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        Project.objects.get_write_project(
            project_uuid=dataset.project_key.uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Failed to delete dataset.")

    dataset.delete()
    return {"success": True}


@api.get("/tags", response=List[TagOut])
@paginate
def get_tags(request, sub_str: str = None):
    q = Q()
    if sub_str:
        q &= Q(combined_tag__icontains=sub_str)

    tags = (
        Tag.objects.annotate(
            full_name=Concat("key", Value(":"), "tag", combined_tag=CharField())
        )
        .filter(q)
        .distinct()
    )
    return tags


class VisualizationQuerySchema(Schema):
    tags: List[str] = Field(None, alias="tags")
    name: str = Field(None, alias="name")


@api.get("/public/visualizations", response=List[VisualizationNoConfOut])
@paginate
def get_published_visualizations(
    request, query_filters: DatasetQuerySchema = Query(...)
):
    q = Q()
    if query_filters.tags:
        t = Tag.objects.filter(tag__in=query_filters.tags)
        q &= Q(tags__in=t)
    visualizations = (
        VisualizationConf.objects.filter(Q(published=True) & q)
        .order_by("-modified_timestamp")
        .distinct()
        .values()
    )
    return visualizations


@api.get("/visualizations", auth=Authorized(), response=List[VisualizationNoConfOut])
def get_project_visualizations(
    request, project_uuid: str, query_filters: VisualizationQuerySchema = Query(...)
):
    project = _get_project(
        user=request.auth,
        project_uuid=project_uuid,
        error_message="Visualization not found.",
    )
    q = Q()
    if query_filters.tags:
        t = Tag.objects.filter(uuid__in=query_filters.tags)
        q &= Q(tags__in=t)
    if query_filters.name:
        q &= Q(name__icontains=query_filters.name)
    visualizations = (
        VisualizationConf.objects.filter(Q(project_key=project) & q)
        .distinct()
        .order_by("-modified_timestamp")
    )
    return visualizations


@api.get("/visualizations/tags", auth=Authorized(), response=List[TagOut])
def get_project_visualizations_Tags(request, project_uuid: str):
    project = Project.objects.get_read_project(
        user=request.auth, project_uuid=project_uuid
    )
    field_values = (
        VisualizationConf.objects.filter(Q(project_key=project))
        .values("tags__tag", "tags__uuid", "tags__key", "tags__uuid")
        .distinct()
        .exclude(tags__uuid=None)
    )

    tags = [
        dict(tag=item["tags__tag"], key=item["tags__key"], uuid=item["tags__uuid"])
        for item in field_values
    ]

    return tags


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
        if attr == "published":
            setattr(visualization, "published_timestamp", timezone.now())
        setattr(visualization, attr, value)
    visualization.save()
    return {"success": True}


@api.put("/visualizations/{visualization_uuid}/tags", auth=Authorized())
def tag_visualization(request, visualization_uuid: str, payload: TagsIn):
    visualization = get_object_or_404(VisualizationConf, uuid=visualization_uuid)
    try:
        project = Project.objects.get_write_project(
            project_uuid=visualization.project_key.uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Failed to tag visualization.")
    tags = []
    for t in payload.tags:
        try:
            tag = Tag.objects.get(tag=t["tag"], key=t["key"], project_key=project)
        except Tag.DoesNotExist:
            tag = Tag.objects.create(tag=t["tag"], key=t["key"], project_key=project)
        tags.append(tag)

    visualization.tags.set(tags)
    return {"success": True}


@api.post("/visualizations", auth=Authorized(), response={201: VisualizationIn})
def create_visualization(request, visualization: VisualizationIn):
    visualization_dict = visualization.dict()
    project_uuid = visualization_dict.get("project_uuid")
    del visualization_dict["project_uuid"]

    try:
        project = Project.objects.get_write_project(
            user=request.auth, project_uuid=project_uuid
        )
    except Project.DoesNotExist:
        raise Http404("Failed to create visualization.")
    VisualizationConf.objects.create(**visualization_dict, project_key=project)
    return visualization
