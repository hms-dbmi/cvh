"""Health-check endpoint wiring.

django-health-check 4.x runs a default set of checks (Cache, Database, DNS,
Mail, Storage) from the view itself. Under 3.x the checks came from
INSTALLED_APPS instead, and CVH installed only the base `health_check` app
without any of the `health_check.db` / `.cache` / `.storage` sub-apps — so
the endpoint ran no checks at all and was green by construction.

Pin the set explicitly rather than inherit 4.x's defaults:

* Mail — CVH configures no mail backend, so this always fails and turns the
  whole endpoint into a 500.
* DNS — resolves the *container's own* hostname. It says nothing about
  whether CVH can serve traffic, and is noisy under ECS.
* Storage — writes and deletes a probe file through the default storage
  backend. Useful only where that backend is a real dependency, which it
  isn't here.

That leaves the two backing services a request actually needs.
"""

from health_check.views import HealthCheckView


class CvhHealthCheckView(HealthCheckView):
    checks = (
        "health_check.checks.Cache",
        "health_check.checks.Database",
    )
