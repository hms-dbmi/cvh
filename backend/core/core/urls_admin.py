"""URL surface for the admin SERVICE_VARIANT.

Mounts only the Django admin, the OIDC auth flow, and the health endpoint
— deliberately no `/api/` so that even if traffic is routed to this
service, the public REST API isn't reachable here.

`admin/login/` is intercepted *before* the admin urlconf so the built-in
username/password form is never reachable: the only path to authenticate
is through Auth0.
"""

from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path


def _redirect_to_oidc(request):
    return redirect("oidc_authentication_init")


urlpatterns = [
    path("admin/login/", _redirect_to_oidc),
    path("admin/", admin.site.urls),
    path("oidc/", include("mozilla_django_oidc.urls")),
    path("health/", include("health_check.urls")),
]
