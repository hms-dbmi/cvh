from django.utils import timezone
from ninja import Router

from ..auth import Authorized
from ..models import YacAccessRequest
from ..schema import ErrorOut, YacAccessIn, YacAccessOut
from ..yac_terms import TERMS, TERMS_VERSION

router = Router(tags=["YAC"])


def _out(access: YacAccessRequest | None) -> dict:
    if access is None:
        return {"status": "none", "terms_version": TERMS_VERSION, "terms": TERMS}
    return {
        "status": access.status,
        "requested_at": access.requested_at,
        "decided_at": access.decided_at,
        "decline_reason": access.decline_reason,
        "terms_version": TERMS_VERSION,
        "terms": TERMS,
    }


@router.get(
    "/yac/access",
    auth=Authorized(),
    response=YacAccessOut,
    summary="Get my YAC access",
    description=(
        "The signed-in user's YAC access request and its status, or `none`"
        " if they haven't asked. The YAC page shows the request form, a"
        " pending notice, the chat, or the reason it was declined from this."
    ),
)
def get_yac_access(request):
    return _out(YacAccessRequest.objects.filter(user=request.auth).first())


@router.post(
    "/yac/access",
    auth=Authorized(),
    response={200: YacAccessOut, 409: ErrorOut},
    summary="Request YAC access",
    description=(
        "Submits a request to use YAC, accepting the current beta terms. A"
        " declined or revoked user can ask again. Returns 409 with code"
        " `already_requested` while a request is pending or approved."
    ),
)
def request_yac_access(request, access_in: YacAccessIn):
    access = YacAccessRequest.objects.filter(user=request.auth).first()
    if access and access.status in (
        YacAccessRequest.Status.pending,
        YacAccessRequest.Status.approved,
    ):
        return 409, {
            "code": "already_requested",
            "detail": f"Your YAC access is already {access.status}.",
        }
    access, _ = YacAccessRequest.objects.update_or_create(
        user=request.auth,
        defaults={
            "auth0_user_id": request.auth0_user_id,
            "affiliation": access_in.affiliation,
            "purpose": access_in.purpose,
            "terms_version": TERMS_VERSION,
            "status": YacAccessRequest.Status.pending,
            "decline_reason": "",
            "requested_at": timezone.now(),
            "decided_at": None,
            "decided_by": None,
        },
    )
    return _out(access)
