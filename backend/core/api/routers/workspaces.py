import contextlib

from django.db.models import Count
from ninja import Router
from ninja.pagination import paginate

from ..auth import Authorized
from ..helpers import _get_workspace
from ..models import Project, ProjectMember, VisualizationConf
from ..schema import (
    PartialWorkspaceIn,
    SuccessOut,
    WorkspaceIn,
    WorkspaceOut,
    WorkspaceOutWithMembersCount,
)

router = Router(tags=["Workspaces"])


@router.post(
    "/workspaces",
    auth=Authorized(),
    response={201: WorkspaceIn},
    summary="Create a workspace",
    description=(
        "Creates a new workspace. The authenticated user becomes"
        " the admin and an initial visualization is created."
    ),
)
def create_workspace(request, workspace: WorkspaceIn):
    user_key = {"user_key": request.auth}
    p = Project.objects.create(**workspace.dict(), **user_key)
    ProjectMember.objects.create(
        project_key=p, user_key=request.auth, permissions=3
    )
    VisualizationConf.objects.create(project_key=p, name="Visualization 1")
    return p


@router.get(
    "/workspaces",
    auth=Authorized(),
    response=list[WorkspaceOutWithMembersCount],
    summary="List user workspaces",
    description=(
        "Returns all private workspaces the authenticated user"
        " has read access to, ordered by last modified. Paginated."
    ),
)
@paginate
def get_workspaces(request):
    workspaces = (
        Project.objects.get_read_projects(user=request.auth)
        .filter(private=True)
        .order_by("-modified_timestamp")
        .values()
        .annotate(
            workspace_members_count=Count(
                "projectmember", distinct=True
            )
        )
    )
    return workspaces


@router.delete(
    "/workspaces/{workspace_uuid}",
    auth=Authorized(),
    response=SuccessOut,
    summary="Delete a workspace",
    description=(
        "Permanently deletes a workspace and all associated"
        " data. Requires admin access."
    ),
)
def delete_workspace(request, workspace_uuid: str):
    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=workspace_uuid
    )
    project.delete()
    return {"success": True}


@router.get(
    "/public/workspaces",
    auth=Authorized(),
    response=list[WorkspaceOut],
    summary="List public workspaces",
    description=(
        "Returns all public workspaces, ordered by last"
        " modified. Paginated."
    ),
)
@paginate
def get_public_workspaces(request):
    workspaces = (
        Project.objects.filter(private=False)
        .order_by("-modified_timestamp")
        .values()
    )
    return workspaces


@router.get(
    "/workspaces/{workspace_uuid}",
    auth=Authorized(),
    response=WorkspaceOut,
    summary="Get a workspace",
    description=(
        "Returns a single workspace by UUID. Accessible if the"
        " workspace is public or the user has read access."
    ),
)
def get_workspace(request, workspace_uuid: str):
    project = _get_workspace(
        user=request.auth,
        workspace_uuid=workspace_uuid,
        error_message="Workspace not found.",
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
    "/workspaces/{workspace_uuid}",
    auth=Authorized(),
    response=SuccessOut,
    summary="Update a workspace",
    description=(
        "Partially updates a workspace's name, description,"
        " or visibility. Requires admin access."
    ),
)
def update_workspace(
    request, workspace_uuid: str, payload: PartialWorkspaceIn
):
    payload_dict = payload.dict(exclude_unset=True)
    project = Project.objects.get_admin_project(
        project_uuid=workspace_uuid, user=request.auth
    )
    for attr, value in payload_dict.items():
        setattr(project, attr, value)
    project.save()
    return {"success": True}
