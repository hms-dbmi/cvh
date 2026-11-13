"""CVH's udiagent entry point: udiagent's server plus monthly YAC budgets.

Each person gets YAC_USER_MONTHLY_USD a month, or the amount in their YAC
token's `https://cvh/yac_monthly_usd` claim (set from Auth0 app_metadata to
grant a bump), and everyone together gets YAC_TOTAL_MONTHLY_USD. Spending is
kept in DynamoDB, one running total per person per UTC month plus one total.

Needs udiagent with budget_check(token_payload, usage) (udi-yac #243).
"""

import calendar
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


@app.middleware("http")
async def record_usage(request, call_next):
    # udiagent's benchmark calls the model on our Bedrock role without
    # sending usage headers, so its spending would never count against the
    # budgets. It's a developer tool; refuse it and its analysis here.
    if request.url.path.startswith("/v1/yac/benchmark"):
        return JSONResponse({"error": "Not found."}, status_code=404)
    response = await call_next(request)
    if (
        request.url.path == "/v1/yac/completions"
        and response.status_code == 200
        and "x-usage-total-tokens" in response.headers
    ):
        try:
            # udiagent verified this token before answering 200.
            sub = jwt.get_unverified_claims(
                request.headers["authorization"].split(" ", 1)[1]
            )["sub"]
            await run_in_threadpool(record, sub, response.headers)
        except Exception:
            # The AWS Budgets alert is the backstop for unrecorded turns.
            log.exception("could not record YAC usage")
    return response


app.state.budget_check = budget_check
