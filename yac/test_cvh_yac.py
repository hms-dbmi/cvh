from datetime import UTC, datetime

import pytest
from udiagent.orchestrator import Usage

import cvh_yac


class FakeDynamoDB:
    """The two DynamoDB calls cvh_yac makes, kept in a dict."""

    def __init__(self):
        self.items = {}

    def batch_get_item(self, RequestItems):
        ((table, req),) = RequestItems.items()
        keys = [k["pk"]["S"] for k in req["Keys"]]
        return {
            "Responses": {
                table: [
                    {"pk": {"S": k}, "spent_usd": {"N": str(self.items[k])}}
                    for k in keys
                    if k in self.items
                ]
            }
        }

    def update_item(self, TableName, Key, ExpressionAttributeValues, **_):
        k = Key["pk"]["S"]
        self.items[k] = self.items.get(k, 0) + float(
            ExpressionAttributeValues[":c"]["N"]
        )


@pytest.fixture
def db(monkeypatch):
    fake = FakeDynamoDB()
    monkeypatch.setattr(cvh_yac, "_dynamodb", fake)
    monkeypatch.setattr(cvh_yac, "_table", "usage")
    return fake


def usage(prompt=0, completion=0):
    u = Usage()
    u.prompt_tokens, u.completion_tokens = prompt, completion
    return u


def month_key(sub):
    return f"user#{sub}#{datetime.now(UTC):%Y-%m}"


def total_key():
    return f"total#{datetime.now(UTC):%Y-%m}"


def test_cost_uses_cached_rate_for_cached_prompt_tokens():
    # 1M uncached input + 1M cached input + 1M output
    assert cvh_yac.cost_usd(2_000_000, 1_000_000, 0, 1_000_000) == pytest.approx(
        2.20 + 0.11 + 11.00
    )


def test_new_user_can_start_a_turn(db):
    assert cvh_yac.budget_check({"sub": "auth0|a"}, usage()) is None


def test_user_at_their_monthly_limit_is_refused(db):
    db.items[month_key("auth0|a")] = 1.99
    message = cvh_yac.budget_check({"sub": "auth0|a"}, usage(completion=1_000))
    assert "$2 YAC budget" in message


def test_bump_in_the_token_raises_the_limit(db):
    db.items[month_key("auth0|a")] = 3.00
    token = {"sub": "auth0|a", cvh_yac.LIMIT_CLAIM: 5}
    assert cvh_yac.budget_check(token, usage()) is None


def test_everyone_is_refused_once_the_total_is_reached(db):
    db.items[total_key()] = 100.0
    message = cvh_yac.budget_check({"sub": "auth0|b"}, usage())
    assert "monthly limit" in message


def test_refuses_when_spending_cannot_be_read(db, monkeypatch):
    def broken(**_):
        raise RuntimeError("DynamoDB is down")

    monkeypatch.setattr(db, "batch_get_item", broken)
    assert "unavailable" in cvh_yac.budget_check({"sub": "auth0|a"}, usage())


def test_finished_turn_counts_against_user_and_total(db):
    headers = {"x-usage-prompt-tokens": "100000", "x-usage-completion-tokens": "10000"}
    turn = cvh_yac.record("auth0|a", headers)
    assert turn == pytest.approx(0.22 + 0.11)
    assert db.items[month_key("auth0|a")] == pytest.approx(turn)
    assert db.items[total_key()] == pytest.approx(turn)


def test_december_resets_in_january():
    assert cvh_yac._reset_date(datetime(2026, 12, 15, tzinfo=UTC)) == "January 1"


def test_completed_turn_is_recorded_through_the_server(db, monkeypatch):
    import udiagent.server.app as server
    from fastapi.testclient import TestClient
    from jose import jwt

    def fake_completions(*_, **__):
        return [], {
            "X-Usage-Prompt-Tokens": "100000",
            "X-Usage-Completion-Tokens": "10000",
            "X-Usage-Total-Tokens": "110000",
        }

    monkeypatch.setattr(server, "completions", fake_completions)
    token = jwt.encode({"sub": "auth0|a"}, "test", algorithm="HS256")
    response = TestClient(cvh_yac.app).post(
        "/v1/yac/completions",
        json={
            "messages": [{"role": "user", "content": "Files by DCC?"}],
            "dataSchema": "{}",
            "dataDomains": "{}",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    assert db.items[month_key("auth0|a")] == pytest.approx(0.33)


@pytest.mark.parametrize("path", ["/v1/yac/benchmark", "/v1/yac/benchmark_analysis"])
def test_benchmark_routes_are_refused(db, monkeypatch, path):
    import udiagent.server.app as server
    from fastapi.testclient import TestClient

    # Its spending would bypass the budgets, so it must never reach udiagent.
    monkeypatch.setattr(server, "completions", pytest.fail)
    response = TestClient(cvh_yac.app).request(
        "POST" if path.endswith("benchmark") else "GET", path, json={}
    )
    assert response.status_code == 404


def _post_turn(token_sub, body=None):
    from fastapi.testclient import TestClient
    from jose import jwt

    token = jwt.encode({"sub": token_sub}, "test", algorithm="HS256")
    return TestClient(cvh_yac.app).post(
        "/v1/yac/completions",
        json=body
        or {
            "messages": [{"role": "user", "content": "Files by DCC?"}],
            "dataSchema": "{}",
            "dataDomains": "{}",
        },
        headers={"Authorization": f"Bearer {token}"},
    )


def test_oversized_turn_is_refused_before_the_model(db, monkeypatch):
    import udiagent.server.app as server

    monkeypatch.setattr(server, "completions", pytest.fail)
    response = _post_turn(
        "auth0|a",
        {
            "messages": [{"role": "user", "content": "x" * cvh_yac.MAX_BODY_BYTES}],
            "dataSchema": "{}",
            "dataDomains": "{}",
        },
    )
    assert response.status_code == 413


def test_second_turn_while_one_is_running_is_refused(db, monkeypatch):
    import udiagent.server.app as server

    monkeypatch.setattr(server, "completions", pytest.fail)
    monkeypatch.setattr(cvh_yac, "_running", {"auth0|a"})
    assert _post_turn("auth0|a").status_code == 429


def test_finished_turn_frees_the_user(db, monkeypatch):
    import udiagent.server.app as server

    monkeypatch.setattr(server, "completions", lambda *_, **__: ([], {}))
    assert _post_turn("auth0|a").status_code == 200
    assert cvh_yac._running == set()


def test_our_refusals_carry_cors_headers(db, monkeypatch):
    from fastapi.testclient import TestClient
    from jose import jwt

    # Registered inside udiagent's CORS middleware, so browsers can read why.
    monkeypatch.setattr(cvh_yac, "_running", {"auth0|a"})
    token = jwt.encode({"sub": "auth0|a"}, "test", algorithm="HS256")
    response = TestClient(cvh_yac.app).post(
        "/v1/yac/completions",
        json={"messages": [], "dataSchema": "{}", "dataDomains": "{}"},
        headers={
            "Authorization": f"Bearer {token}",
            "Origin": "https://dev.visualizationhub.org",
        },
    )
    assert response.status_code == 429
    assert "access-control-allow-origin" in response.headers


def test_streamed_body_over_the_limit_is_cut_off(db, monkeypatch):
    import udiagent.server.app as server
    from fastapi.testclient import TestClient

    monkeypatch.setattr(server, "completions", pytest.fail)

    def chunks():  # no Content-Length, so only the streaming cap can stop it
        for _ in range(cvh_yac.MAX_BODY_BYTES // 65536 + 2):
            yield b"x" * 65536

    response = TestClient(cvh_yac.app).post("/v1/yac/completions", content=chunks())
    assert response.status_code == 413


def test_failed_turn_is_charged_an_estimate(db, monkeypatch):
    import udiagent.server.app as server
    from fastapi import HTTPException

    def failing_completions(*_, **__):
        raise HTTPException(502, "model call failed")

    monkeypatch.setattr(server, "completions", failing_completions)
    response = _post_turn("auth0|a")
    assert response.status_code == 502
    sent = len(response.request.content)
    # record() stores six decimal places.
    assert db.items[month_key("auth0|a")] == pytest.approx(
        cvh_yac.cost_usd(sent // 4, 0, 0, 0), abs=1e-6
    )


def test_unprocessed_spending_keys_refuse_the_turn(db, monkeypatch):
    monkeypatch.setattr(
        db,
        "batch_get_item",
        lambda **_: {"Responses": {"usage": []}, "UnprocessedKeys": {"usage": {}}},
    )
    assert "unavailable" in cvh_yac.budget_check({"sub": "auth0|a"}, usage())


def test_udiagent_passes_the_token_to_our_check(db):
    # udi-yac #243: the server binds each request's token to the hook.
    from udiagent.server.app import _budget_check

    check = _budget_check({"sub": "auth0|a"})
    db.items[month_key("auth0|a")] = 2.0
    assert "$2 YAC budget" in check(usage())


def test_lists_packages_udiagent_did_not_load(tmp_path):
    backends = tmp_path / "yac-packages.json"
    backends.write_text('{"cfdb": {}, "other": {}}')
    assert cvh_yac.missing_backends(str(backends), {"cfdb": object()}) == ["other"]


def test_server_refuses_to_start_without_its_data(tmp_path):
    import json
    import os
    import subprocess
    import sys

    backends = tmp_path / "yac-packages.json"
    missing_db = str(tmp_path / "cfdb.duckdb")
    backends.write_text(
        json.dumps({"cfdb": {"type": "duckdb", "database": missing_db}})
    )
    result = subprocess.run(
        [sys.executable, "-c", "import cvh_yac"],
        check=False,
        env={**os.environ, "UDI_QUERY_BACKENDS": str(backends)},
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "query backends failed to load: cfdb" in result.stderr


def test_usage_reports_percent_and_renewal(db):
    db.items["user#auth0|a#2026-12"] = 0.5
    result = cvh_yac.usage({"sub": "auth0|a"}, datetime(2026, 12, 15, tzinfo=UTC))
    assert result == {
        "spent_usd": 0.5,
        "limit_usd": 2.0,
        "percent_used": 25,
        "renews_on": "2027-01-01",
    }


def test_usage_uses_the_bump_and_stops_at_100(db):
    db.items[month_key("auth0|a")] = 12.0
    result = cvh_yac.usage({"sub": "auth0|a", cvh_yac.LIMIT_CLAIM: 5})
    assert (result["limit_usd"], result["percent_used"]) == (5.0, 100)


def test_usage_endpoint_reads_the_verified_token(db, monkeypatch):
    import udiagent.server.app as server
    from fastapi.testclient import TestClient

    db.items[month_key("auth0|a")] = 1.8
    monkeypatch.setitem(
        cvh_yac.app.dependency_overrides,
        server.verify_jwt,
        lambda: {"sub": "auth0|a"},
    )
    response = TestClient(cvh_yac.app).get("/v1/yac/usage")
    assert response.status_code == 200, response.text
    assert response.json()["percent_used"] == 90


@pytest.mark.parametrize(
    ("claims", "allowed"),
    [
        ({"sub": "auth0|a", "permissions": ["use:yac"]}, True),
        ({"sub": "auth0|a", "permissions": []}, False),
        ({"sub": "auth0|a"}, False),
    ],
)
def test_tokens_need_the_yac_permission(db, monkeypatch, claims, allowed):
    from fastapi import HTTPException

    # Stand in for udiagent's signature check; ours runs after it.
    monkeypatch.setattr(cvh_yac, "_verify_token", lambda *_, **__: claims)
    if allowed:
        assert cvh_yac._verify_with_permission() == claims
    else:
        with pytest.raises(HTTPException) as refused:
            cvh_yac._verify_with_permission()
        assert refused.value.status_code == 403


def test_every_endpoint_uses_the_permission_check():
    import udiagent.server.app as server

    assert (
        cvh_yac.app.dependency_overrides[server.verify_jwt]
        is cvh_yac._verify_with_permission
    )
