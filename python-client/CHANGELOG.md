# Changelog — `cvh-client`

Notable changes to the Python client. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The client releases to TestPyPI on its own cadence (independent of CVH prod deploys). Each release corresponds to a version bump in `VERSION.txt` + tag. The [`[Unreleased]`](#unreleased) section captures work merged to `main` but not yet cut into a release.

Categories: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**.

## [Unreleased]

### Added
- Datasets now report which viewer they belong to. A new `tool` field on each `Dataset` is either `"gosling"` or `"vitessce"`.
- `list_datasets(...)` accepts a `tool` argument, so you can narrow a workspace's listing to just Gosling or just Vitessce datasets.
- Vitessce-native file types (OME-TIFF, OME-Zarr, AnnData Zarr, SpatialData Zarr) are now documented alongside Gosling's formats in the `Dataset.file_type` docstring.

### Changed
- `update_dataset(...)` now documents `tool` as an updatable field, so callers know they can move a dataset between viewers if it was created under the wrong one.
