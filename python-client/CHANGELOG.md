# Changelog — `cvh-client`

Notable changes to the Python client. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The client releases to PyPI on its own cadence (independent of CVH prod deploys). Each release corresponds to a version bump in `VERSION.txt` + tag. The [`[Unreleased]`](#unreleased) section captures work merged to `main` but not yet cut into a release.

Categories: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**.

## [Unreleased]

## [0.4.1] - 2026-10-09

### Fixed
- The sign-in example in the README, the `CVHClient` docstrings and both example notebooks used the wrong Auth0 `client_id` for the hosted CVH, so `from_login()` failed with `403 Forbidden` (`unauthorized_client`) from `/oauth/device/code`. They now use the CVH client app, `FKDEMc1rao9wVRnMIE9RznPsiLeHRXJS`.
- `pip install "cvh-client[vitessce]"` now also installs `anywidget`, which Vitessce's notebook widget needs. Before, `VitessceConfig.widget()` (used in the Vitessce example notebook) failed with `ModuleNotFoundError: No module named 'anywidget'`.

## [0.4.0] - 2026-10-09

Needs the CVH backend from 2026-10-09 or later: `create_workspace` and `create_dataset` rely on the create endpoints returning the new record.

### Added
- `publish_visualization(uuid)` and `unpublish_visualization(uuid)` make a visualization public or private again, the same as the Publish and Make Private buttons in the app. Previously this was only possible by passing `published=True` to `update_visualization`.
- `create_dataset(workspace_uuid, name, file_type, ...)` registers a dataset by URL and returns it, `uuid` included. Its docstring lists the extra fields each file type needs.
- Tags: `set_dataset_tags` and `set_visualization_tags` replace an item's tags (accepting `Tag` objects or `{"key", "tag"}` dicts), and `list_dataset_tags` and `list_visualization_tags` list the tags in use in a workspace, whose UUIDs feed the `tags` filters. `list_dataset_field_values` lists the distinct assemblies or file types in a workspace.
- Public endpoints: `list_public_visualizations` and `get_public_visualization` work without signing in; `list_public_workspaces` lists public workspaces.
- `Workspace.created_by` (a new `CreatedBy` model with username, name and email), which the API already returned. `Tag` and `CreatedBy` are now importable from `cvh_client`.
- The Vitessce example notebook ends by publishing the visualization and printing its public link.

### Fixed
- `create_workspace()` created the workspace, then raised a validation error because the API sent back only the name, description and privacy flag. The API now returns the full workspace.

### Changed
- Supports Python 3.10 and newer, down from 3.13, so it installs in hosted notebook environments that run older Pythons. CI also runs the tests on 3.10.
- The README's method tables now list every method.

## [0.3.0] - 2026-10-09

The first release on [PyPI](https://pypi.org/project/cvh-client/): install with `pip install cvh-client`. Earlier versions (0.1.0, 0.2.0) were published only to TestPyPI.

### Added
- Datasets now report which viewer they belong to. A new `tool` field on each `Dataset` is either `"gosling"` or `"vitessce"`.
- `list_datasets(...)` accepts a `tool` argument, so you can narrow a workspace's listing to just Gosling or just Vitessce datasets.
- Vitessce-native file types (OME-TIFF, OME-Zarr including its zipped variant, AnnData in Zarr including zipped and h5ad, SpatialData in Zarr including zipped) are now documented alongside Gosling's formats in the `Dataset.file_type` docstring.

### Changed
- `update_dataset(...)` now documents `tool` as an updatable field, so callers know they can move a dataset between viewers if it was created under the wrong one.
