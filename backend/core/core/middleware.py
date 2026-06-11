import json
import logging
import time
import uuid

from django.http import HttpResponse

logger = logging.getLogger("api_usage")

# Clients we know about (sent via X-CVH-Client header). Anything else is
# bucketed as "unknown" so the dashboard's `client` dimension stays bounded.
_KNOWN_CLIENTS = {"web", "python"}


class HealthCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == "/health":
            return HttpResponse("ok")
        return self.get_response(request)


class ApiUsageMiddleware:
    """Logs one structured line per request, including a CloudWatch Embedded
    Metric Format block so CloudWatch auto-extracts RequestCount, Latency,
    and ErrorCount metrics under the CVH/API namespace dimensioned by client.

    The same log line is queryable via CloudWatch Logs Insights for ad-hoc
    questions the dashboard doesn't answer.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip the health check loop so we don't drown the dashboard.
        if request.path == "/health":
            return self.get_response(request)

        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = int((time.monotonic() - start) * 1000)

        client_header = request.META.get("HTTP_X_CVH_CLIENT", "").strip().lower()
        client = client_header if client_header in _KNOWN_CLIENTS else "unknown"

        user_id = None
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            user_id = getattr(user, "username", None) or getattr(user, "pk", None)

        is_error = response.status_code >= 500

        # Use the URL pattern (e.g. `api/visualizations/<uuid:uuid>`) rather
        # than the resolved path so per-UUID requests aggregate into one row
        # in dashboard tables. Falls back to the raw path for unresolved
        # requests (404s, malformed URLs).
        resolver_match = getattr(request, "resolver_match", None)
        endpoint = (
            resolver_match.route if resolver_match is not None else request.path
        )

        payload = {
            "_aws": {
                "Timestamp": int(time.time() * 1000),
                "CloudWatchMetrics": [
                    {
                        "Namespace": "CVH/API",
                        "Dimensions": [["client"]],
                        "Metrics": [
                            {"Name": "RequestCount", "Unit": "Count"},
                            {"Name": "Latency", "Unit": "Milliseconds"},
                            {"Name": "ErrorCount", "Unit": "Count"},
                        ],
                    }
                ],
            },
            "event": "api_request",
            "client": client,
            "RequestCount": 1,
            "Latency": duration_ms,
            "ErrorCount": 1 if is_error else 0,
            "method": request.method,
            "endpoint": endpoint,
            "raw_path": request.path,
            "status": response.status_code,
            "user_id": str(user_id) if user_id is not None else None,
            "user_agent": request.META.get("HTTP_USER_AGENT"),
            "request_id": str(uuid.uuid4()),
        }

        logger.info(json.dumps(payload))
        return response
