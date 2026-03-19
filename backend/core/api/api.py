from ninja import NinjaAPI

from .auth import ForbiddenError, UnauthorizedError
from .routers.datasets import router as datasets_router
from .routers.members import router as members_router
from .routers.tags import router as tags_router
from .routers.users import router as users_router
from .routers.visualizations import router as visualizations_router
from .routers.workspaces import router as workspaces_router

api = NinjaAPI(
    title="Community Visualization Hub API",
    description=(
        "REST API for the Community Visualization Hub (CVH) — a platform for"
        " creating and managing genomic visualizations using Gosling.js and"
        " Vitessce. Funded by the NIH Common Fund Data Ecosystem (CFDE)."
    ),
    version="1.0.0",
)


@api.exception_handler(UnauthorizedError)
def unauthorized_exception(request, _):
    return api.create_response(
        request,
        {"message": "Unauthorized."},
        status=401,
    )


@api.exception_handler(ForbiddenError)
def forbidden_exception(request, _):
    return api.create_response(
        request,
        {"message": "Forbidden."},
        status=403,
    )


api.add_router("", users_router)
api.add_router("", members_router)
api.add_router("", workspaces_router)
api.add_router("", datasets_router)
api.add_router("", visualizations_router)
api.add_router("", tags_router)
