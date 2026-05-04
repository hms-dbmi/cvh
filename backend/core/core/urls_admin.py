"""URL surface for the admin SERVICE_VARIANT.

Mounts only the Django admin and the health endpoint — deliberately no
`/api/` so that even if traffic is routed to this service, the public REST
API isn't reachable here.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", include("health_check.urls")),
]
