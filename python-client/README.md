# cvh-client

Python API client for the [Community Visualization Hub (CVH)](https://github.com/hms-dbmi/community-visualization-hub) — a platform for creating and managing genomic visualizations using [Gosling.js](https://gosling-lang.org/) and [Vitessce](https://vitessce.io/). Designed for use in Jupyter notebooks.

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

# Authenticate via Auth0 (opens browser)
client = CVHClient.from_login(
    base_url="https://your-cvh-instance.com",
    domain="your-tenant.auth0.com",
    client_id="your-client-id",
    audience="https://your-cvh-instance.com",
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

```bash
uv sync                          # Install dependencies
uv run pytest                    # Run tests
uv run ruff check src/           # Lint
uv run ruff format src/          # Format
```

## Publishing

Releases are published to PyPI automatically via GitHub Actions when a [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) is created. The workflow uses [trusted publishing](https://docs.pypi.org/trusted-publishers/) (no API token needed).

Setup required once on PyPI:
1. Go to https://pypi.org/manage/project/cvh-client/settings/publishing/
2. Add a trusted publisher with repository `hms-dbmi/cvh-client`, workflow `publish.yml`, and environment `pypi`
