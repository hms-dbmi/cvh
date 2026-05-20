from uuid import UUID

from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.db.models import F
from django.http import Http404
from django.shortcuts import get_object_or_404
from ninja import Router

from ..auth import Authorized
from ..models import Project, ProjectMember
from ..schema import (
    SuccessOut,
    WorkspaceMemberIn,
    WorkspaceMemberOut,
    WorkspaceMemberUpdate,
)

router = Router(tags=["Workspace Members"])


@router.post(
    "/workspaces/{workspace_uuid}/members",
    auth=Authorized(),
    response=SuccessOut,
    summary="Add a workspace member",
    description=(
        "Adds a user to a workspace with read permissions."
        " Requires admin access to the workspace."
    ),
)
def add_workspace_member(
    request, workspace_uuid: UUID, member: WorkspaceMemberIn
):
    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=workspace_uuid
    )
    user = get_object_or_404(User, email=member.email)
    ProjectMember.objects.create(
        project_key=project, user_key=user, permissions=1
    )
    return {"success": True}


@router.put(
    "/workspaces/{workspace_uuid}/members",
    auth=Authorized(),
    response=SuccessOut,
    summary="Update a workspace member",
    description=(
        "Updates a member's permissions on a workspace."
        " Requires admin access."
        " Cannot modify your own permissions."
    ),
)
def update_workspace_member(
    request, workspace_uuid: UUID, member: WorkspaceMemberUpdate
):
    member_dict = member.dict(exclude_unset=True)

    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=workspace_uuid
    )
    project_member = get_object_or_404(
        ProjectMember,
        user_key__email=member.email,
        project_key=project,
    )

    if project_member.user_key == request.auth:
        raise PermissionDenied()

    for attr, value in member_dict.items():
        setattr(project_member, attr, value)
    project_member.save()
    return {"success": True}


@router.delete(
    "/workspaces/{workspace_uuid}/members",
    auth=Authorized(),
    response=SuccessOut,
    summary="Remove a workspace member",
    description=(
        "Removes a user from a workspace."
        " Requires admin access. Cannot remove yourself."
    ),
)
def delete_workspace_member(
    request, workspace_uuid: UUID, member: WorkspaceMemberIn
):
    try:
        project = Project.objects.get_admin_project(
            user=request.auth,
            project_uuid=workspace_uuid,
        )

    except Project.DoesNotExist:
        raise Http404("Failed to remove workspace member.") from None

    project_member = get_object_or_404(
        ProjectMember,
        user_key__email=member.email,
        project_key=project,
    )
    if project_member.user_key == request.auth:
        raise PermissionDenied()
    project_member.delete()
    return {"success": True}


@router.get(
    "/workspaces/{workspace_uuid}/members",
    auth=Authorized(),
    response=list[WorkspaceMemberOut],
    summary="List workspace members",
    description=(
        "Returns all members of a workspace with their"
        " permissions and profile info. Requires read access."
    ),
)
def get_workspace_members(request, workspace_uuid: UUID):
    try:
        project = Project.objects.get_read_project(
            user=request.auth, project_uuid=workspace_uuid
        )
    except Project.DoesNotExist:
        raise Http404("Failed to get workspace members.") from None
    members = ProjectMember.objects.filter(
        project_key=project
    ).values(
        "permissions",
        username=F("user_key__username"),
        email=F("user_key__email"),
        first_name=F("user_key__first_name"),
        last_name=F("user_key__last_name"),
    )
    return members
