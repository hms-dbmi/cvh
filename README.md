# Community Visualization Hub

A platform for creating, sharing, and collaborating on genomic and single-cell visualizations powered by [Gosling](https://gosling-lang.org/) and [Vitessce](https://vitessce.io/).

**Live instance:** [visualizationhub.org](https://visualizationhub.org)

**Changelog:** [`CHANGELOG.md`](./CHANGELOG.md) tracks what's merged to `main` (running on dev) vs. what's shipped to prod. The `[Unreleased]` section is dev-but-not-yet-prod. Release process lives in [`docs/release.md`](./docs/release.md).

## Contributing

Bug reports, feature requests, and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) to get started. Licensed under [MIT](./LICENSE).

## Common commands

Each package is developed in its own subdirectory. Run these from inside the package (`cd backend`, `cd frontend`, or `cd python-client`).

| Task | Backend (`backend/`) | Frontend (`frontend/`) | Python client (`python-client/`) |
|---|---|---|---|
| Install deps | `uv sync` | `npm install` | `uv sync` |
| Dev server | `python core/manage.py runserver` | `npm run dev` | — (library) |
| Unit tests | `python core/manage.py test` | `npm test` (or `npx vitest run`) | `uv run pytest` |
| E2E tests | — | `npm run e2e` | — |
| Lint | `uv run ruff check .` | `npm run lint` | `uv run ruff check src/ tests/` |
| Lint (auto-fix) | `uv run ruff check --fix .` | `npm run lint:fix` | `uv run ruff check --fix src/ tests/` |
| Format | `uv run ruff format .` | `npm run format` | `uv run ruff format src/ tests/` |
| Build (prod bundle) | — (Docker builds via `Dockerfile`) | `npm run build` | `uv build` |
| Regen OpenAPI types | — | `npm run gen-api-types` (backend must be running) | — (client is hand-written) |

Full setup instructions and environment configuration are below.

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

In production these env vars are still read the same way; the difference is *transport*. Three sources at runtime:

- **S3 EnvironmentFile** — most non-secret operational config (`DEBUG`, `ALLOWED_HOSTS`, `ALLOWED_ORIGINS`, `AUTH0_DOMAIN`, `AUTH0_IDENTIFIER`, `DB_ENGINE`).
- **CFN-injected inline `Environment:`** — values the parent stack derives from other stacks' outputs (`DB_HOST`, `DB_PORT`, `DB_NAME` from the database stack; `SERVICE_VARIANT` for the admin task). These auto-update on CFN changes, so they don't need to be kept in sync manually in S3.
- **Secrets Manager via `Secrets:` injection** — referenced in `cloudformation/back-end.yml`:

- **`RdsSecretArn`** — the RDS-managed secret auto-created with the database instance. RDS owns its schema (`username`, `password`) and may rotate `password` on a schedule, so app-level secrets do *not* go here. Provides `DB_USER`, `DB_PASSWORD`.
- **`AppSecretsArn`** — a separate Secrets Manager entry for app-level secrets. Add new app-level secrets here as the codebase grows.
  ```json
  { "secret_key": "<django secret>" }
  ```
  Provides `SECRET_KEY`.

If either secret is encrypted with a customer-managed KMS key, that key's resource policy must grant `kms:Decrypt` to the `ECSExecutionRole` (the role ECS uses to inject secrets before the container starts). Previously, this permission lived on the `TaskContainerRole` because the running app fetched the DB secret via boto3; the role grant is no longer needed there since the running app no longer touches Secrets Manager directly.

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

## Testing

### Frontend unit tests ([Vitest](https://vitest.dev/))

```bash
cd frontend
npm test            # watch mode
npx vitest run      # single run
```

### Frontend end-to-end tests ([Playwright](https://playwright.dev/) + [MSW](https://mswjs.io/))

The e2e suite runs against a fully-mocked app — no backend or Auth0 tenant needed. When `VITE_E2E=true`, `Auth0Provider` is replaced with a stub that exposes a fake authenticated user, and an MSW service worker intercepts every API call using fixtures defined in `frontend/src/test/msw-handlers.ts`. Specs assert the outgoing request body via a `window.__e2eRequests` log — see the comment in `msw-handlers.ts` for why we record on `window` instead of using Playwright's `page.route`.

First-time setup (downloads the Chromium binary):

```bash
cd frontend
npx playwright install chromium
```

Run the suite:

```bash
cd frontend
npm run e2e                          # all specs
npx playwright test e2e/publish.spec.ts   # one spec
npx playwright test --ui             # interactive runner
npx playwright show-report           # open the HTML report from the last run
```

The Playwright config (`frontend/playwright.config.ts`) starts its own Vite dev server on port 5174 with `VITE_E2E=true`, so you can keep your normal `npm run dev` running on 5173 in parallel. Reports go to `frontend/playwright-report/` (gitignored). Tests also run in CI via `.github/workflows/e2e.yml` on every push and PR to `main`.

## API Documentation

The backend serves interactive API documentation via [Django Ninja](https://django-ninja.dev/):

- **Swagger UI:** [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
- **OpenAPI schema (JSON):** [http://127.0.0.1:8000/api/openapi.json](http://127.0.0.1:8000/api/openapi.json)

In production these are available at `https://api.visualizationhub.org/api/docs` and `https://api.visualizationhub.org/api/openapi.json`.

## License

Released under the [MIT License](./LICENSE).

## Acknowledgements

The Community Visualization Hub is funded by the National Institutes of Health (NIH) [Common Fund Data Ecosystem (CFDE)](https://commonfund.nih.gov/dataecosystem) program under award [U24OD038421](https://reporter.nih.gov/project-details/10993963). The project was inspired by the Reservoir Genomics Platform (resgen) created by Peter Kerpedjiev & Nezar Abdennur.
