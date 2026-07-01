"""cfdb HTTP client. Thin wrapper around `requests` for the operations the
CVH backend needs — readiness probes and workflow dispatch for the `/data`
and `/index` artifacts.

cfdb tracks `/data` and `/index` readiness independently: hitting `/data`
once may produce both artifacts internally, but each URL has its own
serving cache that requires its own first-touch. Callers that need both
artifacts (indexed file types) must check and dispatch both.
"""

from dataclasses import dataclass
from typing import Literal
from urllib.parse import urlparse

import requests
from django.conf import settings

ArtifactKind = Literal["data", "index"]


class CfdbError(Exception):
    """Raised for any non-202/non-2xx cfdb response, or transport-level
    failures (timeouts, DNS, etc.). The caller maps this to an HTTP error
    visible to the user.
    """


@dataclass(frozen=True)
class CfdbDispatchResult:
    """Outcome of `GET /{kind}/{dcc}/{id}` for a single artifact. cfdb
    returns 202 on cache miss (workflow dispatched) with a
    `Location: /jobs/{id}` header; on cache hit it returns 200/206 with
    the bytes. We never want the bytes here, so we use a streaming
    request and abort before consuming them.
    """

    # 202 if processing was dispatched; 200/206 if already cached.
    status_code: int
    # Set only when status_code == 202.
    job_id: str | None


def check_artifact_ready(
    dcc: str, cfdb_id: str, *, kind: ArtifactKind, timeout: float = 10.0
) -> bool:
    """Probe `GET /{kind}/{dcc}/{id}/status` — cfdb's side-effect-free
    readiness check for one artifact. Never dispatches a workflow.
    """
    url = f"{settings.CFDB_BASE_URL}/{kind}/{dcc}/{cfdb_id}/status"
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        raise CfdbError(f"cfdb {kind} status check failed: {exc}") from exc
    return bool(data.get("ready"))


def dispatch_artifact(
    dcc: str, cfdb_id: str, *, kind: ArtifactKind, timeout: float = 10.0
) -> CfdbDispatchResult:
    """Send `GET /{kind}/{dcc}/{id}` to cfdb to start processing for one
    artifact. Streams the response so headers can be read and the
    connection closed without pulling bytes on a cache hit.

    Callers should gate this with `check_artifact_ready` — cfdb's intended
    "is processing needed?" pattern without side effects.
    """
    url = f"{settings.CFDB_BASE_URL}/{kind}/{dcc}/{cfdb_id}"
    try:
        with requests.get(url, stream=True, timeout=timeout) as response:
            if response.status_code == 202:
                location = response.headers.get("Location", "")
                job_id = _parse_job_id(location)
                if not job_id:
                    raise CfdbError(
                        f"cfdb 202 with unparseable Location: {location!r}"
                    )
                return CfdbDispatchResult(status_code=202, job_id=job_id)
            if response.status_code in (200, 206):
                # Race: status said not-ready but artifact landed between
                # then and now. Treat as cache hit.
                return CfdbDispatchResult(
                    status_code=response.status_code, job_id=None
                )
            raise CfdbError(
                f"cfdb unexpected status {response.status_code} for {url}"
            )
    except requests.RequestException as exc:
        raise CfdbError(f"cfdb {kind} request failed: {exc}") from exc


def _parse_job_id(location: str) -> str | None:
    """Extract the job id from a `Location: /jobs/{id}` header. Accepts
    both relative paths and absolute URLs.
    """
    if not location:
        return None
    path = urlparse(location).path or location
    parts = [p for p in path.split("/") if p]
    if len(parts) >= 2 and parts[-2] == "jobs":
        return parts[-1]
    return None
