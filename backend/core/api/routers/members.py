from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.db.models import F
from django.http import Http404
from django.shortcuts import get_object_or_404
from ninja import Router

from ..auth import Authorized
from ..models import Project, ProjectMember
from ..schema import (
    ProjectMemberIn,
    ProjectMemberOut,
    ProjectMemberUpdate,
    SuccessOut,
)

router = Router(tags=["Project Members"])


@router.post(
    "/projects/members",
    auth=Authorized(),
    response=SuccessOut,
    summary="Add a project member",
    description=(
        "Adds a user to a project with read permissions."
        " Requires admin access to the project."
    ),
)
def add_project_member(request, member: ProjectMemberIn):
    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=member.project_uuid
    )
    user = get_object_or_404(User, email=member.email)
    ProjectMember.objects.create(project_key=project, user_key=user, permissions=1)
    return {"success": True}


@router.put(
    "/projects/members",
    auth=Authorized(),
    response=SuccessOut,
    summary="Update a project member",
    description=(
        "Updates a member's permissions on a project."
        " Requires admin access. Cannot modify your own permissions."
    ),
)
def update_project_member(request, member: ProjectMemberUpdate):
    member_dict = member.dict(exclude_unset=True)

    project = Project.objects.get_admin_project(
        user=request.auth, project_uuid=member.project_uuid
    )
    project_member = get_object_or_404(
        ProjectMember, user_key__email=member.email, project_key=project
    )

    if project_member.user_key == request.auth:
        raise PermissionDenied()

    del member_dict["project_uuid"]
    for attr, value in member_dict.items():
        setattr(project_member, attr, value)
    project_member.save()
    return {"success": True}


@router.delete(
    "/projects/members",
    auth=Authorized(),
    response=SuccessOut,
    summary="Remove a project member",
    description=(
        "Removes a user from a project."
        " Requires admin access. Cannot remove yourself."
    ),
)
def delete_project_member(request, member: ProjectMemberIn):
    try:
        project = Project.objects.get_admin_project(
            user=request.auth, project_uuid=member.project_uuid
        )

    except Project.DoesNotExist:
        raise Http404("Failed to remove project member.") from None

    project_member = get_object_or_404(
        ProjectMember, user_key__email=member.email, project_key=project
    )
    if project_member.user_key == request.auth:
        raise PermissionDenied()
    project_member.delete()
    return {"success": True}


@router.get(
    "/projects/{project_uuid}/members",
    auth=Authorized(),
    response=list[ProjectMemberOut],
    summary="List project members",
    description=(
        "Returns all members of a project with their"
        " permissions and profile info. Requires read access."
    ),
)
def get_project_members(request, project_uuid: str):
    try:
        project = Project.objects.get_read_project(
            user=request.auth, project_uuid=project_uuid
        )
    except Project.DoesNotExist:
        raise Http404("Failed to get project members.") from None
    project_members = ProjectMember.objects.filter(project_key=project).values(
        "permissions",
        username=F("user_key__username"),
        email=F("user_key__email"),
        first_name=F("user_key__first_name"),
        last_name=F("user_key__last_name"),
    )
    return project_members
