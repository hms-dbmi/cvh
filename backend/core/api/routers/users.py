from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from ninja import Router

from ..auth import Authorized
from ..schema import SuccessOut, UserIn, UserOut

router = Router(tags=["Users"])


@router.get(
    "/user",
    auth=Authorized(),
    response=UserOut,
    summary="Get current user",
    description="Returns profile information for the authenticated user.",
)
def get_user_info(request):
    return get_object_or_404(User, username=request.auth)


@router.put(
    "/user",
    auth=Authorized(),
    response=SuccessOut,
    summary="Update current user",
    description=(
        "Updates profile fields (first name, last name)"
        " for the authenticated user."
    ),
)
def update_user_info(request, user_in: UserIn):
    user = get_object_or_404(User, username=request.auth)
    user_dict = user_in.dict(exclude_unset=True)

    for attr, value in user_dict.items():
        setattr(user, attr, value)
    user.save()
    return {"success": True}
