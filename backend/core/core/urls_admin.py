"""URL surface for the admin SERVICE_VARIANT.

Mounts only the Django admin, the OIDC auth flow, and the health endpoint
— deliberately no `/api/` so that even if traffic is routed to this
service, the public REST API isn't reachable here.

`admin/login/` is intercepted *before* the admin urlconf so the built-in
username/password form is never reachable: the only path to authenticate
is through Auth0.
"""

from urllib.parse import urlencode

from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import include, path, reverse


def _redirect_to_oidc(request):
    # Forward the `next` query param so mozilla-django-oidc can redirect
    # the user back to where they originally tried to go after login.
    target = reverse("oidc_authentication_init")
    next_url = request.GET.get("next")
    if next_url:
        target = f"{target}?{urlencode({'next': next_url})}"
    return HttpResponseRedirect(target)


urlpatterns = [
    path("admin/login/", _redirect_to_oidc),
    path("admin/", admin.site.urls),
    path("oidc/", include("mozilla_django_oidc.urls")),
    path("health/", include("health_check.urls")),
]
