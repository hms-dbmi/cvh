# CVH

Community Visualization Hub — a platform for creating and managing genomic visualizations using [Gosling](https://gosling-lang.org/).

## Prerequisites

- `git`: Suggest [installing Apple Xcode](https://developer.apple.com/xcode/).
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (backend package manager)
- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (Node.js version manager)
- Python 3.13.1 (managed via `.python-version`)
- Node.js 22.13.1 (managed via `.nvmrc`)
- PostgreSQL (or Docker)
- An [Auth0](https://auth0.com/) tenant with a Single Page Application and API configured

## Setup

### Backend

With Docker (includes PostgreSQL):

```bash
cd backend
docker compose --env-file ./core/.env up
```

Without Docker (requires local PostgreSQL):

```bash
cd backend
uv venv --python $(cat .python-version)
source .venv/bin/activate
uv sync
```

### Frontend

```bash
cd frontend
nvm install $(cat .nvmrc)
nvm use $(cat .nvmrc)
npm install
```

## Environment Configuration

### Backend (`backend/core/.env`)

Copy the example and fill in the values:

```bash
cd backend/core
cp .env.example .env
```

| Variable | Local Development Value |
|---|---|
| `DEBUG` | `true` |
| `SECRET_KEY` | Generate with: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'` |
| `DB_ENGINE` | `django.db.backends.postgresql` |
| `DB_NAME` | Your database name |
| `DB_USER` | Your database user |
| `DB_PASSWORD` | Your database password |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` |
| `AUTH0_DOMAIN` | Your Auth0 domain (e.g. `https://your-tenant.us.auth0.com/`) |
| `AUTH0_IDENTIFIER` | Your Auth0 API identifier / audience |
| `ECS_CONTAINER_METADATA_URI_V4` | Leave empty for local development |

### Frontend (`frontend/.env`)

Copy the example and fill in the values:

```bash
cd frontend
cp .env.example .env
```

| Variable | Local Development Value |
|---|---|
| `VITE_AUTH0_DOMAIN` | Your Auth0 domain (e.g. `your-tenant.us.auth0.com`) |
| `VITE_AUTH0_CLIENTID` | Your Auth0 SPA application client ID |
| `VITE_API_AUDIENCE` | Your Auth0 API identifier (same as `AUTH0_IDENTIFIER` in backend) |
| `VITE_API_URL` | `http://127.0.0.1:8000` |
| `VITE_CLOUDFRONT_URL` | CloudFront distribution URL for images (can be left empty locally) |

## Running the Development Servers

### Backend

```bash
cd backend/core
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

When using Docker, you still need to run migrations. Either exec into the container or run them before starting compose:

```bash
docker compose --env-file ./core/.env exec django-web python ./core/manage.py migrate
```

### Frontend

The backend must be running at `http://127.0.0.1:8000` before generating API types.

```bash
cd frontend
npm run gen-api-types  # Fetches OpenAPI schema from http://127.0.0.1:8000/api/openapi.json
npm run dev
```

## Linting and Formatting

### Backend ([Ruff](https://docs.astral.sh/ruff/))

```bash
cd backend
uv run ruff check .          # Lint
uv run ruff check --fix .    # Lint with auto-fix
uv run ruff format .         # Format
```

### Frontend ([Biome](https://biomejs.dev/))

```bash
cd frontend
npm run lint                 # Lint and check formatting
npm run lint:fix             # Lint and format with auto-fix
npm run format               # Format
```

## Acknowledgements

The Community Visualization Hub is funded by the National Institutes of Health (NIH) [Common Fund Data Ecosystem (CFDE)](https://commonfund.nih.gov/dataecosystem) program under award [U24OD038421](https://reporter.nih.gov/project-details/10993963). The project was inspired by the Reservoir Genomics Platform (resgen) created by Peter Kerpedjiev & Nezar Abdennur.
