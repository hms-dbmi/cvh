from django.utils import timezone
from ninja import Router

from ..auth import Authorized
from ..models import YacAccessRequest
from ..schema import ErrorOut, YacAccessOut

router = Router(tags=["YAC"])


def _out(access: YacAccessRequest | None) -> dict:
    if access is None:
        return {"status": "none"}
    return {
        "status": access.status,
        "requested_at": access.requested_at,
        "decided_at": access.decided_at,
    }


@router.get(
    "/yac/access",
    auth=Authorized(),
    response=YacAccessOut,
    summary="Get my AI access",
    description=(
        "The signed-in user's AI (YAC) access request and its status, or"
        " `none` if they haven't asked."
    ),
)
def get_yac_access(request):
    return _out(YacAccessRequest.objects.filter(user=request.auth).first())


@router.post(
    "/yac/access",
    auth=Authorized(),
    response={200: YacAccessOut, 409: ErrorOut},
    summary="Request AI access",
    description=(
        "Submits a request to use YAC. Each person can ask once: returns 409"
        " with code `already_requested` if they have a request in any state."
        " Declined or revoked users contact us, and an admin can approve"
        " their existing request again."
    ),
)
def request_yac_access(request):
    access, created = YacAccessRequest.objects.get_or_create(
        user=request.auth,
        defaults={
            "auth0_user_id": request.auth0_user_id,
            "requested_at": timezone.now(),
        },
    )
    if not created:
        return 409, {
            "code": "already_requested",
            "detail": f"Your AI access request is {access.status}.",
        }
    return _out(access)
