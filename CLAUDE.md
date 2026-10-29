# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Community Visualization Hub (CVH) — a platform for creating and managing genomic visualizations using Gosling.js and Vitessce. Funded by the NIH Common Fund Data Ecosystem (CFDE).

**Production URL:** `visualizationhub.org` (frontend), `api.visualizationhub.org` (API), `admin.visualizationhub.org` (Django admin). Dev uses the same names under `dev.visualizationhub.org`.

## Tech Stack

- **Backend:** Django 5.2 + Django Ninja REST API, Python 3.13, PostgreSQL 17
- **Frontend:** React 19 + TypeScript 5.7, Vite 6, TanStack Router + Query, MUI 6, Tailwind 4, Zustand
- **Python client** (`python-client/`): `cvh-client` on PyPI, Python 3.10+. See `python-client/CLAUDE.md`.
- **Auth:** Auth0 (JWT tokens)
- **Infra:** AWS (ECS Fargate, S3, CloudFront, RDS), CloudFormation in `cloudformation/`
- **Package managers:** `uv` (backend, python-client), `npm` (frontend)

## Common Commands

### Backend (run from `backend/` directory)

```bash
# Setup
uv venv --python $(cat .python-version)
source .venv/bin/activate
uv sync

# Run with Docker (includes PostgreSQL)
docker compose --env-file ./core/.env up

# Run without Docker (requires local PostgreSQL)
cd core
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

# Lint and format (ruff is a dev dependency, use via uv run)
uv run ruff check .            # Lint
uv run ruff check --fix .      # Lint with auto-fix
uv run ruff format .           # Format
```

### Frontend (run from `frontend/` directory)

```bash
npm install
npm run dev                # Vite dev server
npm run build              # tsc -b && vite build
npm test                   # Vitest (watch mode)
npx vitest run             # Vitest (single run)
npm run lint               # Biome check (linting + formatting)
npm run lint:fix           # Biome check --write (auto-fix)
npm run format             # Biome format --write
npm run e2e                # Playwright e2e tests (mocked API)
npm run gen-api-types      # Generate TS types from backend OpenAPI schema (backend must be running)
```

The `gen-api-types` command hits `http://127.0.0.1:8000/api/openapi.json` and writes to `frontend/src/types/schema.d.ts`. The backend server must be running when you execute it.

## Architecture

### Backend (`backend/core/`)

Single Django app `api` with Django Ninja providing the REST API:

- `api/api.py` — NinjaAPI setup; registers the routers
- `api/routers/` — endpoints by domain: `workspaces.py`, `datasets.py`, `visualizations.py`, `members.py`, `users.py`
- `api/models.py` — ORM models: `Project` (a workspace), `Dataset`, `VisualizationConf`, `ProjectMember`, `Tag`, `Group`
- `api/cfdb.py` — cfdb client: readiness checks and processing for Browse Library datasets
- `api/schema.py` — Pydantic schemas for request/response validation
- `core/settings.py` — Django settings; reads `.env` from `core/.env`, fetches AWS Secrets Manager creds in production (detected via `ECS_CONTAINER_METADATA_URI_V4`)
- `core/middleware.py` — health check and API usage middleware
- The same image runs two ECS services: `SERVICE_VARIANT=api` (`core/urls.py`) and `SERVICE_VARIANT=admin` (`core/urls_admin.py`, Django admin behind Auth0 OIDC, see `docs/admin-deployment.md`)

Permission model: `ProjectMember` has integer permission levels (1=read, 2=write, 3=admin). `ProjectsManager` on the `Project` model provides queryset methods that filter by permission level.

### Frontend (`frontend/src/`)

- **Routing:** TanStack Router with file-based routes in `src/routes/`
- **Feature modules:** `src/features/` — organized by domain: `projects/` (workspaces), `datasets/`, `visualizations/`, `navigation/`, `landing/`, `team/`, `tutorials/`
- **API layer:** `openapi-fetch` + `openapi-react-query` for type-safe API calls against generated types from `src/types/schema.d.ts`
- **State:** Zustand for client state, TanStack Query for server state
- **Auth:** Auth0 via `@auth0/auth0-react`, configured in `src/Provider.tsx`
- **Theme:** MUI theme in `src/theme.tsx`

### Environment Variables

Backend (`backend/core/.env`): `DEBUG`, `SECRET_KEY`, `DB_*`, `ALLOWED_HOSTS`, `ALLOWED_ORIGINS`, `AUTH0_DOMAIN`, `AUTH0_IDENTIFIER`, `CFDB_BASE_URL`, `SERVICE_VARIANT`, `ECS_CONTAINER_METADATA_URI_V4`

Frontend (`frontend/.env`): `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENTID`, `VITE_API_AUDIENCE`, `VITE_API_URL`, `VITE_CLOUDFRONT_URL`, `VITE_CFDB_API_URL`, `VITE_ENVIRONMENT`, `VITE_FEATURED_PATH`, plus optional analytics (`VITE_GA_MEASUREMENT_ID`, `VITE_PUBLIC_POSTHOG_*`)

Both have `.env.example` files as templates.

## CI/CD

A push to `main` deploys to dev:
- `deploy-api.yml` — builds the Docker image, pushes to ECR, redeploys the dev API and admin services
- `deploy-front-end.yml` — builds Vite, syncs to S3, invalidates CloudFront

Prod deploys are manual (`workflow_dispatch`): `deploy-api-prod.yml` promotes an ECR image, `deploy-front-end-prod.yml` builds and syncs the prod site. See `docs/release.md`.

Tests run on PRs: `test-frontend.yml`, `e2e.yml`, `test-python-client.yml`. `publish-client.yml` publishes `cvh-client` to TestPyPI or PyPI by hand.

## Dataset Types

Supported genomic file types: bigwig, vector, cooler, multivec, bam, vcf, bed, gff, beddb, csv.
