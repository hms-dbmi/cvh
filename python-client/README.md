# cvh-client

Python API client for the [Community Visualization Hub (CVH)](https://github.com/hms-dbmi/cvh) — a platform for creating and sharing interactive genomic, spatial, and single-cell visualizations powered by [Gosling.js](https://gosling-lang.org/) and [Vitessce](https://vitessce.io/). Designed for use in Jupyter notebooks.

Source lives in the CVH monorepo under [`python-client/`](https://github.com/hms-dbmi/cvh/tree/main/python-client). File issues at [hms-dbmi/cvh/issues](https://github.com/hms-dbmi/cvh/issues).

## Installation

Requires Python 3.13+.

```bash
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ cvh-client
```

With [Vitessce](https://vitessce.io/) widget support:

```bash
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ cvh-client[vitessce]
```

## Quick start

```python
from cvh_client import CVHClient

# Authenticate against the hosted CVH via Auth0 (opens a browser
# for the device-authorization flow). Swap `base_url`, `domain`,
# `client_id`, and `audience` for your own deployment's values if
# you're self-hosting.
client = CVHClient.from_login(
    base_url="https://api.visualizationhub.org",
    domain="auth.visualizationhub.org",
    client_id="BlOrQcABtV8FrluOQnIO3bWCG1MQU9bx",
    audience="cvh-api-prod-id",
)

# List workspaces
workspaces = client.list_workspaces()
ws = workspaces.items[0]

# List datasets and visualizations in a workspace
datasets = client.list_datasets(ws.uuid)
visualizations = client.list_visualizations(ws.uuid)

# Get a single visualization with its config
viz = client.get_visualization(visualizations[0].uuid)

# Update a visualization
client.update_visualization(viz.uuid, name="New name", conf={...})
```

Token expiration is handled automatically — if the client was created via `from_login()`, it will re-authenticate when the token expires.

## API methods

### Workspaces

| Method | Description |
|---|---|
| `list_workspaces(limit, offset)` | List workspaces the user has access to |
| `get_workspace(uuid)` | Get a single workspace |

### Datasets

| Method | Description |
|---|---|
| `list_datasets(workspace_uuid, *, tags, assembly, file_type, name, page, page_size)` | List datasets in a workspace with optional filters |
| `get_dataset(uuid)` | Get a single dataset |
| `update_dataset(uuid, **fields)` | Update dataset metadata |

### Visualizations

| Method | Description |
|---|---|
| `create_visualization(workspace_uuid, name, *, description, author, tool)` | Create a new visualization |
| `list_visualizations(workspace_uuid, *, tags, name)` | List visualizations in a workspace |
| `get_visualization(uuid)` | Get a visualization with its full config |
| `update_visualization(uuid, **fields)` | Update visualization metadata or config |

All methods return typed Pydantic models (`Workspace`, `Dataset`, `Visualization`, etc.).

### Error handling

API errors raise descriptive exceptions:

```python
from cvh_client import NotFoundError, AuthorizationError, CVHAPIError

try:
    client.get_visualization("nonexistent-uuid")
except NotFoundError as e:
    print(e.status_code)  # 404
    print(e.detail)       # {"detail": "..."}
except AuthorizationError:
    print("Check your permissions")
except CVHAPIError as e:
    print(f"API error {e.status_code}: {e}")
```

## Examples

See the `examples/` directory for Jupyter notebooks:

- **`getting_started.ipynb`** — Authentication, listing workspaces/datasets/visualizations, basic CRUD
- **`vitessce_workflow.ipynb`** — End-to-end Vitessce workflow: create a visualization with the Codeluppi et al. osmFISH config, retrieve it, view it with the Vitessce widget, modify and update

## Development

Run these from inside `python-client/` (checkout the [monorepo](https://github.com/hms-dbmi/cvh) first).

```bash
uv sync                                # Install dependencies
uv run pytest                          # Run tests
uv run ruff check src/ tests/          # Lint
uv run ruff format src/ tests/         # Format
```

## Releasing

Currently published to [TestPyPI](https://test.pypi.org/project/cvh-client/) via manual GitHub Actions dispatch. To cut a release:

1. Bump the version in **both** `VERSION.txt` and `pyproject.toml` (they must match).
2. Merge to `main`.
3. In the CVH repo's Actions tab → **Publish cvh-client to TestPyPI** → **Run workflow**, entering the same version string as confirmation.

The workflow uses [trusted publishing](https://docs.pypi.org/trusted-publishers/) (OIDC — no long-lived token). Trust is configured on TestPyPI as:

- **Repository**: `hms-dbmi/cvh`
- **Workflow**: `publish-client.yml`
- **Environment**: `testpypi`
