# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

cvh-client is a Python API client library for CVH, designed for use in Jupyter notebooks. Python 3.13+ required.

## Tooling

- **Package manager:** [uv](https://docs.astral.sh/uv/)
- **Build backend:** uv_build (do NOT use hatchling)
- **Linter:** ruff
- **Tests:** pytest with pytest-asyncio

## Commands

- **Install dependencies:** `uv sync`
- **Run tests:** `uv run pytest`
- **Run single test:** `uv run pytest tests/test_client.py::test_name`
- **Lint:** `uv run ruff check src/`
- **Format:** `uv run ruff format src/`
- **Add a dependency:** `uv add <package>`
- **Add a dev dependency:** `uv add --group dev <package>`

## Architecture

- `src/cvh_client/` — package source (src layout)
- `src/cvh_client/client.py` — `CVHClient` class: httpx-based API client with typed methods for workspaces, datasets, and visualizations. Handles automatic token refresh via Auth0.
- `src/cvh_client/auth.py` — Auth0 device authorization flow (OAuth 2.0 Device Grant) and JWT expiration checking
- `src/cvh_client/models.py` — Pydantic models for API responses (Workspace, Dataset, Visualization, etc.)
- `tests/` — pytest test suite
- `examples/` — Jupyter notebooks demonstrating client usage

## API

The CVH API is a REST API for the Community Visualization Hub — a platform for genomic visualizations using Gosling.js. The OpenAPI spec is at `{base_url}/api/openapi.json`.
