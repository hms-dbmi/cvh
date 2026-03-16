import contextlib

from django.db.models import Count
from ninja import Router
from ninja.pagination import paginate

from ..auth import Authorized
from ..helpers import _get_project
from ..models import Project, ProjectMember, VisualizationConf
from ..schema import (
    PartialProjectIn,
    ProjectIn,
    ProjectOut,
    ProjectOutWithMembersCount,
    SuccessOut,
)

router = Router(tags=["Projects"])


@router.post(
    "/projects",
    auth=Authorized(),
    response={201: ProjectIn},
    summary="Create a project",
    description=(
        "Creates a new project (workspace). The authenticated user"
        " becomes the admin and an initial visualization is created."
    ),
)
def create_project(request, project: ProjectIn):
    user_key = {"user_key": request.auth}
    p = Project.objects.create(**project.dict(), **user_key)
    ProjectMember.objects.create(project_key=p, user_key=request.auth, permissions=3)
    VisualizationConf.objects.create(project_key=p, name="Visualization 1")
    return p


@router.get(
    "/projects",
    auth=Authorized(),
    response=list[ProjectOutWithMembersCount],
    summary="List user projects",
    description=(
        "Returns all private projects the authenticated user"
        " has read access to, ordered by last modified. Paginated."
    ),
)
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


@router.delete(
    "/projects/{project_uuid}",
    auth=Authorized(),
    response=SuccessOut,
    summary="Delete a project",
    description=(
        "Permanently deletes a project and all associated data."
        " Requires admin access."
    ),
)
def delete_project(request, project_uuid: str):
    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=project_uuid
    )
    project.delete()
    return {"success": True}


@router.get(
    "/public/projects",
    auth=Authorized(),
    response=list[ProjectOut],
    summary="List public projects",
    description="Returns all public projects, ordered by last modified. Paginated.",
)
@paginate
def get_public_projects(request):
    projects = (
        Project.objects.filter(private=False).order_by("-modified_timestamp").values()
    )
    return projects


@router.get(
    "/projects/{project_uuid}",
    auth=Authorized(),
    response=ProjectOut,
    summary="Get a project",
    description=(
        "Returns a single project by UUID. Accessible if the"
        " project is public or the user has read access."
    ),
)
def get_project(request, project_uuid: str):
    project = _get_project(
        user=request.auth, project_uuid=project_uuid, error_message="Project not found."
    )
    permissions = None
    with contextlib.suppress(ProjectMember.DoesNotExist):
        permissions = ProjectMember.objects.get(
            project_key=project, user_key=request.auth
        ).permissions
    return {
        "uuid": project.uuid,
        "name": project.name,
        "description": project.description,
        "created_timestamp": project.created_timestamp,
        "modified_timestamp": project.modified_timestamp,
        "last_viewed_timestamp": project.last_viewed_timestamp,
        "private": project.private,
        "datasets_count": project.datasets_count,
        "visualizations_count": project.visualizations_count,
        "permissions": permissions,
    }


@router.put(
    "/projects/{project_uuid}",
    auth=Authorized(),
    response=SuccessOut,
    summary="Update a project",
    description=(
        "Partially updates a project's name, description,"
        " or visibility. Requires admin access."
    ),
)
def update_project(request, project_uuid: str, payload: PartialProjectIn):
    payload_dict = payload.dict(exclude_unset=True)
    project = Project.objects.get_admin_project(
        project_uuid=project_uuid, user=request.auth
    )
    for attr, value in payload_dict.items():
        setattr(project, attr, value)
    project.save()
    return {"success": True}
