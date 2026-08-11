# Changelog

All notable changes to CVH (backend + frontend) are recorded here. Follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

The [`[Unreleased]`](#unreleased) section lists what's merged to `main` and running on **dev** but not yet on **prod**. When a prod deploy happens, the deploy workflow renames `[Unreleased]` to a dated block below and starts a fresh `[Unreleased]` section, so answering "what's on dev but not prod?" is always "read the `[Unreleased]` section."

The `python-client/` package tracks its own history in [`python-client/CHANGELOG.md`](./python-client/CHANGELOG.md) because it ships to TestPyPI on its own release rhythm, decoupled from prod deploys.

Categories per Keep a Changelog: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**.

## [Unreleased]

### Added
- Vitessce visualizations can now use CVH datasets. Upload Vitessce-native formats (OME-TIFF, OME-Zarr, AnnData Zarr, SpatialData Zarr) the same way you upload Gosling datasets — each dataset is tagged with the viewer it belongs to, and the two don't mix inside a single visualization.
- The Add Dataset wizard now starts by asking whether you're adding data for Gosling or Vitessce, and then shows only the file types that viewer supports.
- Drag a Vitessce-compatible dataset from the sidebar onto a Vitessce visualization to auto-generate a starter configuration. If the visualization already has a configuration, you'll be asked to confirm before it's replaced. Empty Vitessce visualizations show a hint pointing you at the drop area.

### Changed
- A dataset can only be dragged into a visualization built for the same viewer — Gosling datasets to Gosling visualizations, Vitessce datasets to Vitessce visualizations.

### Removed
- The "Limited Functionality" banner that used to appear above Vitessce visualizations' data panels. Its "no data supported" wording was out of date now that datasets can be added directly.
