# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Community Visualization Hub (CVH) — a platform for creating and managing genomic visualizations using Gosling.js. Funded by the NIH Common Fund Data Ecosystem (CFDE).

**Production URL:** `designer.gosling-lang.org` (frontend), `api.designer.gosling-lang.org` (backend)

## Tech Stack

- **Backend:** Django 5.1 + Django Ninja REST API, Python 3.13, PostgreSQL 17
- **Frontend:** React 19 + TypeScript 5.7, Vite 6, TanStack Router + Query, MUI 6, Zustand
- **Auth:** Auth0 (JWT tokens)
- **Infra:** AWS (ECS Fargate, S3, CloudFront, RDS), CloudFormation in `cloudformation/`
- **Package managers:** `uv` (backend), `npm` (frontend)

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

# Lint
ruff check .
```

### Frontend (run from `frontend/` directory)

```bash
npm install
npm run dev                # Vite dev server
npm run build              # tsc -b && vite build
npm run lint               # ESLint
npm run gen-api-types      # Generate TS types from backend OpenAPI schema (backend must be running)
```

The `gen-api-types` command hits `http://127.0.0.1:8000/api/openapi.json` and writes to `frontend/src/types/schema.d.ts`. The backend server must be running when you execute it.

## Architecture

### Backend (`backend/core/`)

Single Django app `api` with Django Ninja providing the REST API:

- `api/api.py` — All API endpoint definitions (the main file; large)
- `api/models.py` — ORM models: `Project`, `Dataset`, `VisualizationConf`, `ProjectMember`, `Tag`
- `api/schema.py` — Pydantic schemas for request/response validation
- `core/settings.py` — Django settings; reads `.env` from `core/.env`, fetches AWS Secrets Manager creds in production (detected via `ECS_CONTAINER_METADATA_URI_V4`)
- `core/middleware.py` — Custom health check middleware

Permission model: `ProjectMember` has integer permission levels (1=read, 2=write, 3=admin). `ProjectsManager` on the `Project` model provides queryset methods that filter by permission level.

### Frontend (`frontend/src/`)

- **Routing:** TanStack Router with file-based routes in `src/routes/`
- **Feature modules:** `src/features/` — organized by domain: `projects/`, `datasets/`, `visualizations/`, `navigation/`
- **API layer:** `openapi-fetch` + `openapi-react-query` for type-safe API calls against generated types from `src/types/schema.d.ts`
- **State:** Zustand for client state, TanStack Query for server state
- **Auth:** Auth0 via `@auth0/auth0-react`, configured in `src/Provider.tsx`
- **Theme:** MUI theme in `src/theme.tsx`

### Environment Variables

Backend (`backend/core/.env`): `DEBUG`, `SECRET_KEY`, `DB_*`, `ALLOWED_HOSTS`, `ALLOWED_ORIGINS`, `AUTH0_DOMAIN`, `AUTH0_IDENTIFIER`, `ECS_CONTAINER_METADATA_URI_V4`

Frontend (`frontend/.env`): `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENTID`, `VITE_API_AUDIENCE`, `VITE_API_URL`, `VITE_CLOUDFRONT_URL`

Both have `.env.example` files as templates.

## CI/CD

GitHub Actions deploys on push to `main`:
- `deploy-api.yml` — Builds Docker image, pushes to ECR
- `deploy-front-end.yml` — Builds Vite, syncs to S3, invalidates CloudFront

## Dataset Types

Supported genomic file types: bigwig, vector, cooler, multivec, bam, vcf, bed, gff, beddb, csv.
