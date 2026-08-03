# Contributing to the Community Visualization Hub

Thanks for your interest in contributing. Bug reports, feature requests, and pull requests are all welcome.

## Reporting bugs and requesting features

Please open a [GitHub issue](https://github.com/hms-dbmi/cvh/issues). If you're not sure whether something is a bug or intended behavior, open an issue anyway — we'd rather hear about it.

For security-sensitive reports (anything that could compromise user data or credentials if disclosed publicly), please email `hidive@hms.harvard.edu` instead of opening a public issue.

## Development setup

Full setup instructions live in the [README](./README.md). The short version:

- Backend: `cd backend && uv venv --python $(cat .python-version) && source .venv/bin/activate && uv sync`
- Frontend: `cd frontend && nvm use && npm install`
- Fill in `backend/core/.env` and `frontend/.env` from the `.env.example` files

## Making changes

1. **Fork the repo** and create a feature branch off `main`. We use short kebab-case branch names, optionally prefixed with your GitHub handle: `alice/fix-dataset-drag` or `add-processing-status-column`.
2. **Make your changes.** Keep pull requests focused — one behavioral change per PR is easier to review than a bundle.
3. **Run lint and format** before pushing:
   - Backend: `uv run ruff check --fix . && uv run ruff format .`
   - Frontend: `npm run lint:fix && npm run format`
4. **Run tests locally** for the code you touched:
   - Frontend unit: `npx vitest run`
   - Frontend e2e (mocked): `npm run e2e`
   - Backend: `cd backend/core && python manage.py test`

## Pull requests

- Title should describe *what* the PR does, not *how* (e.g. "Show accession IDs in browse table" not "Refactor cfdb hook to return accession").
- Include a short summary of what changed and why in the description.
- Include a test plan — the checklist of things you exercised to verify the change works.
- CI (lint, typecheck, tests) must pass before review.
- Screenshots or short screen recordings are helpful for UI changes.

We use squash merges, so individual commits on your branch don't need to be pristine — the squashed commit message is what lands in `main`.

## Code style

- **Backend**: Python 3.13, Django + Django Ninja, [Ruff](https://docs.astral.sh/ruff/) for lint + format. Config in `backend/pyproject.toml`.
- **Frontend**: TypeScript, React 19, [Biome](https://biomejs.dev/) for lint + format. Config in `frontend/biome.json`.
- Prefer explicit types over `any`. If TypeScript is complaining, the fix is usually clearer types, not `@ts-expect-error`.
- Prefer plain functions and hooks over classes.
- Comments explain *why*, not *what*. Well-named identifiers cover the *what*.

## API type generation

The frontend consumes the backend's OpenAPI schema via generated types (`frontend/src/types/schema.d.ts`). If your PR changes backend endpoints or Pydantic schemas:

1. Start the backend locally (`python manage.py runserver`).
2. From `frontend/`, run `npm run gen-api-types`.
3. Commit the regenerated `schema.d.ts`.

## Design & feature discussions

For larger changes, open an issue first to discuss the approach before writing a big PR. This saves us both time if the direction needs adjustment.

## Questions

- General questions: open a GitHub issue with the "question" label.
- Contact: `hidive@hms.harvard.edu`
