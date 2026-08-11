# CVH Business Continuity Plan

**Status:** Draft. **[TBD]** items need concrete values.
**Last reviewed:** 2026-08-11

CVH is a small research tool with no on-call rotation; incident response is
best-effort during working hours. This doc's job is to make sure that when
something breaks, we already know (a) what we can and can't recover, and (b)
which button to press. Long-form procedure and role definitions belong in
`admin-deployment.md` / `release.md` / your head, not here.

## What we own vs. depend on

CVH stores dataset **URLs**, not dataset **bytes**. Anything at the storage
layer belongs to whoever hosts the URL (S3, cfdb, arbitrary HTTP).

| System | Ours? | Blast radius if lost |
|---|---|---|
| RDS Postgres (workspaces, viz configs, memberships) | ✅ | Full data loss — the state we can't reconstruct from source. |
| S3 SPA + CloudFront | ✅ (reproducible from `main`) | Site serves stale/no content until a redeploy. |
| ECS Fargate services | ✅ (image in ECR) | App down; rebuilt from ECR image. |
| ECR image registry | ✅ | Can't redeploy the API; existing containers keep running. |
| Auth0 tenant | Config yes, uptime no | No user can log in; effectively total outage. |
| cfdb | ❌ external | Cfdb-sourced datasets stop rendering; non-cfdb datasets keep working. |
| Dataset bytes (S3 / cfdb / HTTP) | ❌ external | That specific dataset stops rendering; CVH's own state intact. |

## Backups

| What | How | Retention | Notes |
|---|---|---|---|
| RDS | Automated + PITR | **[TBD]** — RDS default is 7d, extend to ~35d given research-tool usage. | Take a manual snapshot before every schema migration deploy. |
| Multi-AZ | **[TBD]** enabled? | — | Single-AZ = hour+ RTO on an AZ outage. Multi-AZ ~doubles the RDS bill. |
| ECR | Lifecycle policy | **[TBD]** — keep last ≥10 prod tags for rollback | `deploy-api-prod.yml` accepts `source_tag` for rollback. |
| Landing images (S3) | Manual — should mirror `frontend/public/landing/` | **[TBD]** verify no prod-only assets | |
| Auth0 tenant config | Manual export | **[TBD]** where do exports live? | `auth0 tenant settings export` |
| SPA bundle | CI (`deploy-front-end-prod.yml`) | N/A — reproducible from `main` | |
| CVH source + infra | GitHub `hms-dbmi/cvh` + `cloudformation/` | Indefinite (git) | Every contributor's clone is a backup. |

**Not backed up:** dataset bytes on external hosts, Auth0 user accounts.

## Runbooks

**Bad deploy shipped.**
1. `git describe --tags --match 'prod-api-*' --abbrev=0 HEAD^` (or `prod-frontend-*`) for the previous tag.
2. Re-run the corresponding prod deploy workflow with that tag as `source_tag`.

**API service not responding.**
1. `aws ecs describe-services --cluster <api-cluster>` — check service events.
2. If tasks failed to start, verify ECR image tag + task role permissions.
3. Force redeploy of the last-known-good tag via `deploy-api-prod.yml`.

**Database corruption / bad migration.**
1. Scale ECS services to 0 to stop new writes.
2. Snapshot current (corrupted) state for forensics.
3. PITR-restore to just before the incident into a new instance.
4. Update `DB_HOST` in the CFN parameter and redeploy.

**Auth0 outage.** Confirm at `status.auth0.com` and wait — there's no
workaround while it's down. If it becomes recurring, evaluate self-hosted
OIDC.

**cfdb outage.** Hit `${VITE_CFDB_API_URL}/metadata` to confirm. Users can
still use non-cfdb datasets while it's down.

## Open decisions

1. **RTO / RPO targets.** Two numbers — drives the choices below.
2. **RDS retention + Multi-AZ posture.** Cost vs. safety.
3. **Uptime monitoring.** Do we have a synthetic canary today? If not, add one (Cloudflare / UptimeRobot / CloudWatch canary).
4. **Auth0 tenant config export destination.**
5. **ECR lifecycle policy.**
6. **Images-bucket parity with `frontend/public/landing/`.** Confirm or backfill.
7. **Review + drill cadence.**

## Change log

- 2026-08-11 — Initial draft.
