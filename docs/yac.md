# YAC

YAC is [udiagent](https://github.com/hms-dbmi/udi-yac), a natural-language chart agent, running over cfdb metadata. It runs as its own service. The model is gpt-6.1-sol on Amazon Bedrock, called with the service's AWS role, so there is no API key. udiagent checks each request's token against the YAC API in Auth0 itself.

The AWS infrastructure for YAC is maintained separately.

## What's in the repo

| Path | What it is |
| --- | --- |
| `yac/Dockerfile`, `yac/requirements.in` | The image: udiagent from PyPI, pinned with hashes in `yac/requirements.txt` |
| `yac/cvh_yac.py` | The entry point: udiagent's server plus monthly budgets (see Budgets) |
| `yac/cfdb/build.sql`, `yac/cfdb/build.py` | Builds `cfdb.duckdb` from a raw cfdb dump (from udi-yac's `dev/cfdb`) |
| `yac/cfdb/yac-packages.json` | The package description udiagent reads; udi calls it the query backends file |
| `yac/yac.env.example` | Template for the service's settings |
| `.github/workflows/deploy-api.yml` | Once the repo variable `YAC_ENABLED` is `true`, the `yac` job runs the tests, builds and pushes `cvh-yac` (`latest` and the commit SHA) on every push to `main`, then redeploys dev |
| `.github/workflows/test-yac.yml` | Runs the YAC tests on PRs that touch `yac/` |
| `.github/workflows/deploy-api-prod.yml` | Promotes `cvh-yac` to prod together with the API once the production environment's `YAC_PROD_ENABLED` is `true` (see `docs/release.md`) |

## Budgets

`yac/cvh_yac.py` is the server's entry point: udiagent plus monthly budgets. Each person gets `YAC_USER_MONTHLY_USD` ($2) a month, and everyone together gets `YAC_TOTAL_MONTHLY_USD` ($100). Months are UTC calendar months. At about $0.010 a turn, $2 is roughly 200 turns.

- **Before each model call**, udiagent calls `budget_check(token_payload, usage)`, which refuses the turn once this month's spending plus the turn so far reaches either limit. If spending can't be read, it refuses rather than letting the turn run.
- **After each turn**, a middleware reads udiagent's `X-Usage-*` headers, prices the tokens at the US-profile rates in `cvh_yac.py`, and adds the cost to the person's and the overall totals in DynamoDB (`YAC_USAGE_TABLE`). A turn that fails (a 5xx or a crash) sends no usage headers, so it's charged an estimate instead: its request size as input tokens (about 4 bytes each), at most a fresh chat's 25 KB, about a cent. That keeps failed turns from being free. A 503 isn't charged: udiagent answers 503 when it couldn't reach Bedrock or Auth0, before any model call.
- **A turn can finish slightly over a limit**, by about one turn's cost, since the check runs before each call.
- **One turn at a time, 512 KB at most.** A person's second turn while one is running gets a 429, and a request over 512 KB (a fresh chat is about 25 KB) gets a 413. Together they cap how far past a limit anyone can get before their turns are recorded. The lock is per process, which holds while YAC runs as one task. Every request body is also capped at 10 MB while it streams in (udiagent's limit for issue reports, which carry a whole session export), so a request without a `Content-Length` can't fill the task's memory.
- **udiagent's benchmark routes are refused** (`/v1/yac/benchmark*` returns 404). The benchmark calls the model without reporting usage, so its spending would never count.
- **`GET /v1/yac/usage`** returns the signed-in person's `spent_usd`, `limit_usd`, `percent_used` (rounded down, at most 100, and 100 once the shared monthly budget is spent) and `renews_on` (the 1st of next month, UTC), with their YAC token. The profile page and Explore tab show Near Limit from 85% and Limit Reached at 100%.

**Raising someone's budget:** in Auth0, set `yac_monthly_usd` in the person's `app_metadata`, for example `{"yac_monthly_usd": 5}`. It applies when their YAC token renews, or right away if they sign out and back in. The post-login Action (see Auth0 setup) copies it into the token.

## Auth0 setup, per environment

In the environment's tenant:

1. Create the YAC API. Its identifier becomes `JWT_AUDIENCE`. In its settings:
   - Set the token lifetime to 3600 seconds, so removing someone's role takes effect within an hour instead of the default 24.
   - Turn on **RBAC** and **Add Permissions in the Access Token**, and add a permission `use:yac`. `cvh_yac.py` answers 403 to any token without it, so a missing or broken Action can't open YAC to everyone.
   - Under **Application Access**, allow only the CVH single-page app for user access and deny all client (machine-to-machine) access.
   - Turn on **Allow Skipping User Consent**. The CVH app fetches the YAC token silently; without it, Auth0 answers `consent_required` and the profile asks the person to sign in to YAC in a popup.
2. Create the YAC users role and give it the `use:yac` permission. Approving an access request adds the role (see `docs/admin-deployment.md`).
3. Add this post-login Action and attach it to the post-login trigger, with an Action secret `YAC_AUDIENCE` set to the YAC API's identifier. It refuses YAC tokens to people without the role and copies their budget into the token:

   ```js
   exports.onExecutePostLogin = async (event, api) => {
     if (event.resource_server?.identifier !== event.secrets.YAC_AUDIENCE) return;
     if (!event.authorization?.roles?.includes("YAC users")) {
       api.access.deny("YAC access hasn't been granted.");
       return;
     }
     const limit = event.user.app_metadata?.yac_monthly_usd;
     if (typeof limit === "number") {
       api.accessToken.setCustomClaim("https://cvh/yac_monthly_usd", limit);
     }
   };
   ```

   The Action and the permission check overlap on purpose: the Action refuses a token up front with a clear message, and the permission check holds even if the Action is detached or misconfigured.

## Building the data

Build `cfdb.duckdb` from a raw cfdb dump:

```bash
uv run --python 3.13 --with 'duckdb>=2,<3' python yac/cfdb/build.py ~/Downloads/cfdb.duckdb yac/cfdb/cfdb.duckdb
```

The service reads it together with `yac/cfdb/yac-packages.json`, from one directory. Always deploy both files from one build.

## Tests

`requirements.txt` is hashed for the Linux image, so install from `requirements.in` locally:

```bash
uv venv --python 3.13 /tmp/yac-test
VIRTUAL_ENV=/tmp/yac-test uv pip install pytest -r yac/requirements.in
cd yac && /tmp/yac-test/bin/python -m pytest test_cvh_yac.py
```

## Updating udiagent

Change the pin in `yac/requirements.in`, run `uv pip compile requirements.in --python-version 3.13 --python-platform x86_64-unknown-linux-gnu --generate-hashes -o requirements.txt` in `yac/`, and merge. `deploy-api.yml` builds it and redeploys dev; prod gets it on the next `deploy-api-prod.yml` run.

## When something fails

- **`query backends failed to load: cfdb`:** udiagent couldn't open `cfdb.duckdb`, because it's missing, corrupt, or written by a newer DuckDB than the image has. `cvh_yac.py` stops the server instead of letting it run without data. Redeploy both data files from one build.
- **udiagent won't start:** it validates its settings at startup and logs every problem at once. Common ones are `OPENAI_API_KEY` set alongside `UDI_BEDROCK`, `JWT_ALGORITHM` not `RS256`, or only some of the Langfuse values set.
- **Requests return 503:** udiagent couldn't call Bedrock. The cause is logged at `ERROR`.
