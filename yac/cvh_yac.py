"""CVH's udiagent entry point: udiagent's server plus monthly YAC budgets.

Each person gets YAC_USER_MONTHLY_USD a month, or the amount in their YAC
token's `https://cvh/yac_monthly_usd` claim (set from Auth0 app_metadata to
grant a bump), and everyone together gets YAC_TOTAL_MONTHLY_USD. Spending is
kept in DynamoDB, one running total per person per UTC month plus one total.

Needs udiagent with budget_check(token_payload, usage) (udi-yac #243).
"""

import calendar
import functools
import json
import logging
import os
from datetime import UTC, datetime
from typing import Annotated

from botocore.session import get_session
from fastapi import Depends, HTTPException
from fastapi.responses import JSONResponse
from jose import jwt
from starlette.concurrency import run_in_threadpool
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.body_limit import RequestBodyLimitMiddleware
from udiagent.server import app as server
from udiagent.server.app import app

# Older udiagent calls budget_check(usage) without the token: every turn would fail.
if not hasattr(server, "_budget_check"):
    raise RuntimeError(
        "cvh_yac needs udiagent with udi-yac #243 (token-aware budget_check)"
    )


def missing_backends(backends_file: str, loaded: dict) -> list[str]:
    """Packages in the backends file that udiagent didn't load."""
    with open(backends_file) as f:
        return sorted(set(json.load(f)) - set(loaded))


# udiagent only logs a package it can't open (a missing or corrupt
# cfdb.duckdb) and starts anyway, still passing its health check.
_backends_file = os.environ.get("UDI_QUERY_BACKENDS")
if _backends_file and (
    missing := missing_backends(_backends_file, app.state.query_engines)
):
    raise RuntimeError(f"query backends failed to load: {', '.join(missing)}")

log = logging.getLogger("cvh_yac")

# Auth0 puts the YAC users role's permissions in the token (RBAC on the YAC
# API). Checking it here means a missing or broken post-login Action can't
# hand YAC to everyone: without the permission, every endpoint answers 403.
REQUIRED_PERMISSION = "use:yac"
_verify_token = server.verify_jwt


@functools.wraps(_verify_token)  # keeps its Authorization header parameters
def _verify_with_permission(*args, **kwargs):
    payload = _verify_token(*args, **kwargs)
    # Insecure dev mode verifies nothing; budget_check refuses those turns.
    if payload.get("dev_mode"):
        return payload
    if REQUIRED_PERMISSION not in payload.get("permissions", []):
        raise HTTPException(403, "YAC access hasn't been granted.")
    return payload


app.dependency_overrides[server.verify_jwt] = _verify_with_permission

USER_MONTHLY_USD = float(os.environ.get("YAC_USER_MONTHLY_USD", "2"))
TOTAL_MONTHLY_USD = float(os.environ.get("YAC_TOTAL_MONTHLY_USD", "100"))
LIMIT_CLAIM = "https://cvh/yac_monthly_usd"

# USD per million tokens for gpt-6.1-sol on Bedrock's us. profile (model card, 2026-11-02).
PRICE_INPUT = 2.20
PRICE_CACHED = 0.11
PRICE_CACHE_WRITE = 2.75
PRICE_OUTPUT = 11.00

# Keep a month's totals for about 13 months after it starts.
KEEP_SECONDS = 400 * 24 * 3600

# The budget check only sees finished turns, so cap what one turn can cost
# before it's recorded. A fresh chat sends about 25 KB (cfdb's schema and
# domains); 512 KB leaves room for a long conversation.
MAX_BODY_BYTES = 512 * 1024
# People with a turn running. shortcut: per process, which is enough while
# the stack runs one YAC task; move to a DynamoDB lock if it runs more.
_running: set[str] = set()

_table = os.environ.get("YAC_USAGE_TABLE", "")
_dynamodb = None


def _db():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = get_session().create_client(
            "dynamodb", region_name=os.environ.get("AWS_REGION")
        )
    return _dynamodb


def cost_usd(prompt: int, cached: int, cache_write: int, completion: int) -> float:
    # Like OpenAI, prompt counts include the cached and cache-write tokens.
    uncached = max(prompt - cached - cache_write, 0)
    return (
        uncached * PRICE_INPUT
        + cached * PRICE_CACHED
        + cache_write * PRICE_CACHE_WRITE
        + completion * PRICE_OUTPUT
    ) / 1e6


def _month(now: datetime) -> str:
    return now.strftime("%Y-%m")


def _keys(sub: str, month: str) -> tuple[str, str]:
    return f"user#{sub}#{month}", f"total#{month}"


def _spent(keys: tuple[str, str]) -> tuple[float, float]:
    resp = _db().batch_get_item(
        RequestItems={_table: {"Keys": [{"pk": {"S": k}} for k in keys]}}
    )
    # Throttled keys come back unprocessed; reading them as $0 would let the
    # turn through, so treat it as a failed read (budget_check refuses).
    if resp.get("UnprocessedKeys"):
        raise RuntimeError("DynamoDB left YAC spending keys unprocessed")
    found = {
        i["pk"]["S"]: float(i["spent_usd"]["N"]) for i in resp["Responses"][_table]
    }
    return found.get(keys[0], 0.0), found.get(keys[1], 0.0)


def _reset_date(now: datetime) -> str:
    return f"{calendar.month_name[now.month % 12 + 1]} 1"


def budget_check(token_payload: dict, usage) -> str | None:
    """udiagent calls this before each model call; a string refuses the turn."""
    now = datetime.now(UTC)
    try:
        user_spent, total_spent = _spent(_keys(token_payload["sub"], _month(now)))
    except Exception:
        log.exception("could not read YAC spending")
        return "YAC is unavailable right now. Please try again later."
    turn = cost_usd(
        usage.prompt_tokens,
        usage.cached_prompt_tokens,
        usage.cache_write_tokens,
        usage.completion_tokens,
    )
    if total_spent + turn >= TOTAL_MONTHLY_USD:
        return f"YAC has reached its monthly limit. It resets {_reset_date(now)}."
    limit = float(token_payload.get(LIMIT_CLAIM, USER_MONTHLY_USD))
    if user_spent + turn >= limit:
        return (
            f"You've used your ${limit:g} YAC budget for "
            f"{calendar.month_name[now.month]}. It resets {_reset_date(now)}, "
            "or you can request more."
        )
    return None


def usage(token_payload: dict, now: datetime | None = None) -> dict:
    """This month's spending against the person's limit, for the CVH profile
    and Explore tab (Active, Near Limit from 85%, Limit Reached at 100%)."""
    now = now or datetime.now(UTC)
    limit = float(token_payload.get(LIMIT_CLAIM, USER_MONTHLY_USD))
    spent, _ = _spent(_keys(token_payload["sub"], _month(now)))
    renews = datetime(now.year + now.month // 12, now.month % 12 + 1, 1, tzinfo=UTC)
    # Rounded down, so 99.9% isn't shown as Limit Reached; round() first so
    # float error can't turn 85% into 84. A $0 limit means no credits at all.
    percent = 100 if limit <= 0 else min(100, int(round(spent / limit * 100, 6)))
    return {
        "spent_usd": round(spent, 4),
        "limit_usd": limit,
        "percent_used": percent,
        "renews_on": renews.date().isoformat(),
    }


@app.get("/v1/yac/usage")
def get_usage(token_payload: Annotated[dict, Depends(server.verify_jwt)]):
    try:
        return usage(token_payload)
    except Exception:
        log.exception("could not read YAC spending")
        raise HTTPException(503, "YAC usage is unavailable right now.") from None


def record(sub: str, headers, now: datetime | None = None) -> float:
    """Add a finished turn's cost, from udiagent's X-Usage-* headers, to both totals."""
    now = now or datetime.now(UTC)
    turn = cost_usd(
        int(headers.get("x-usage-prompt-tokens", 0)),
        int(headers.get("x-usage-cached-prompt-tokens", 0)),
        int(headers.get("x-usage-cache-write-tokens", 0)),
        int(headers.get("x-usage-completion-tokens", 0)),
    )
    if turn <= 0:
        return 0.0
    expires = str(int(now.timestamp()) + KEEP_SECONDS)
    for key in _keys(sub, _month(now)):
        _db().update_item(
            TableName=_table,
            Key={"pk": {"S": key}},
            UpdateExpression="ADD spent_usd :c SET expires_at = if_not_exists(expires_at, :e)",
            ExpressionAttributeValues={
                ":c": {"N": f"{turn:.6f}"},
                ":e": {"N": expires},
            },
        )
    return turn


async def record_usage(request, call_next):
    # udiagent's benchmark calls the model on our Bedrock role without
    # sending usage headers, so its spending would never count against the
    # budgets. It's a developer tool; refuse it and its analysis here.
    if request.url.path.startswith("/v1/yac/benchmark"):
        return JSONResponse({"error": "Not found."}, status_code=404)
    if request.url.path != "/v1/yac/completions":
        return await call_next(request)

    # Content-Length first, so a huge body is refused before it's read.
    length = request.headers.get("content-length", "")
    declared = int(length) if length.isdigit() else 0
    if declared > MAX_BODY_BYTES or (body_bytes := len(await request.body())) > (
        MAX_BODY_BYTES
    ):
        return JSONResponse(
            {"error": "This conversation is too long. Start a new one."},
            status_code=413,
        )
    # Unverified here; udiagent verifies it, and a forged token only holds
    # the lock until udiagent refuses it.
    sub = _token_sub(request)
    if sub in _running:
        return JSONResponse(
            {"error": "You already have a request running. Wait for it to finish."},
            status_code=429,
        )
    if sub:
        _running.add(sub)
    try:
        response = await call_next(request)
    finally:
        _running.discard(sub)

    if response.status_code == 200 and "x-usage-total-tokens" in response.headers:
        usage_headers = response.headers
    elif response.status_code >= 500 and await _verified(request):
        # A turn that fails after some model calls sends no usage headers, so
        # charge its request once as input (about 4 bytes a token). That can
        # overcharge a turn that failed before any call, by a cent or two.
        usage_headers = {"x-usage-prompt-tokens": str(body_bytes // 4)}
    else:
        return response
    try:
        await run_in_threadpool(record, sub, usage_headers)
    except Exception:
        # The AWS Budgets alert is the backstop for unrecorded turns.
        log.exception("could not record YAC usage")
    return response


async def _verified(request) -> bool:
    """Whether the request's token passes udiagent's check. A 5xx can come
    before verification (Auth0 unreachable), and a forged token mustn't
    charge someone else's budget."""
    try:
        await run_in_threadpool(
            _verify_token,
            authorization=request.headers.get("authorization", ""),
            _scheme=None,
        )
        return True
    except Exception:
        return False


def _token_sub(request) -> str | None:
    try:
        token = request.headers["authorization"].split(" ", 1)[1]
        return jwt.get_unverified_claims(token)["sub"]
    except Exception:
        return None


# Inside udiagent's CORS middleware (user_middleware runs outermost first),
# so browsers can read our 413/429/404 replies. add_middleware or
# @app.middleware would put it outside CORS.
app.user_middleware.append(Middleware(BaseHTTPMiddleware, dispatch=record_usage))
# Outermost: caps a body as it streams in, before anything reads it. FastAPI
# ignores Starlette's max_body_size, so add the middleware directly.
app.user_middleware.insert(
    0, Middleware(RequestBodyLimitMiddleware, max_body_size=MAX_BODY_BYTES)
)

app.state.budget_check = budget_check
