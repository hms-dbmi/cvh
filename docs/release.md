# Release process

CVH deploys to **dev** automatically on every push to `main`, and to **prod** via two manual workflows in `.github/workflows/`:

- `deploy-front-end-prod.yml` — rebuilds the frontend with prod env vars and syncs to the prod S3 bucket + invalidates CloudFront.
- `deploy-api-prod.yml` — retags the ECR image currently tagged `latest` (or a passed-in tag, for rollbacks) as `prod` and forces the prod ECS service to redeploy.

Both workflows are `workflow_dispatch` (manual). A prod deploy usually runs both, back to back.

## Tags

Each prod deploy step ends by pushing an annotated git tag:

- `prod-frontend-YYYY-MM-DD-<sha>` — from `deploy-front-end-prod.yml`.
- `prod-api-YYYY-MM-DD-<sha>` — from `deploy-api-prod.yml`.

These are the source of truth for "what's on prod." Useful commands:

```bash
# What shipped in the last frontend deploy?
git log $(git describe --tags --match 'prod-frontend-*' --abbrev=0 HEAD^)..$(git describe --tags --match 'prod-frontend-*' --abbrev=0)

# What's on main but not on the most recent prod-frontend?
git log $(git describe --tags --match 'prod-frontend-*' --abbrev=0)..main --oneline

# Same for the API:
git log $(git describe --tags --match 'prod-api-*' --abbrev=0)..main --oneline
```

The tags are annotated (`git tag -a`) so `git show <tag>` gives you the deploy date and, for the API, the ECR source tag.

## Rolling the changelog

Both `CHANGELOG.md` (CVH monorepo) and `python-client/CHANGELOG.md` have an `[Unreleased]` section that accumulates entries per PR. After a successful prod deploy, promote it to a dated block.

Manually (~1 minute):

1. In `CHANGELOG.md`, rename the `## [Unreleased]` heading to `## [YYYY-MM-DD] (prod, <sha>)`, using the same date and short sha as the tags the workflow just pushed.
2. Add a fresh empty `## [Unreleased]` section above the newly-dated block. Include the standard subsection headers if it helps the next contributor (Added / Changed / Fixed / etc.), or leave it blank.
3. Open a PR titled `chore: roll changelog for <date> prod deploy` and merge.

That's the whole process. `[Unreleased]` on `main` is now empty until the next PR adds an entry — and its contents at any moment answer "what's on dev but not on prod."

If the deploy fails (e.g., ECS never converges, S3 sync errors), **do not** promote the changelog — the tag will already be pushed by the succeeding step, so tell `main` history by hand: `git push origin :refs/tags/prod-<component>-<date>-<sha>` to delete the stray tag.

## Python client

`python-client/CHANGELOG.md` tracks the TestPyPI package, which releases on its own cadence via `publish-client.yml`. The rolling process is the same (rename `[Unreleased]` to a dated block) but happens on client release, not CVH prod deploy.
