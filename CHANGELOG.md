# Changelog

All notable changes to CVH (backend + frontend) are recorded here. Follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

The [`[Unreleased]`](#unreleased) section lists what's merged to `main` and running on **dev** but not yet on **prod**. When a prod deploy happens, the deploy workflow renames `[Unreleased]` to a dated block below and starts a fresh `[Unreleased]` section, so answering "what's on dev but not prod?" is always "read the `[Unreleased]` section."

The `python-client/` package tracks its own history in [`python-client/CHANGELOG.md`](./python-client/CHANGELOG.md) because it ships to TestPyPI on its own release rhythm, decoupled from prod deploys.

Categories per Keep a Changelog: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**.

## [Unreleased]

### Added
- PostHog product analytics wired up with prod-vs-dev isolation on the free-tier single-project constraint. The SDK only initializes when `VITE_ENVIRONMENT=production` (or the explicit `VITE_POSTHOG_DEBUG=true` escape hatch for preview deploys), and every captured event carries an `environment` super-property so any non-prod traffic that does land can be filtered out at the project level. Session-replay input capture is now masked by default (`maskAllInputs`) so form fields — including the Vitessce/Gosling code editor and Quick Dataset ID Lookup — don't stream verbatim into recordings. Events fired inside a workspace context also tag the current workspace via `posthog.group("workspace", ...)`, so analytics can be sliced per-workspace.
- Vitessce visualizations can now use CVH datasets. Upload Vitessce-native formats — OME-TIFF, OME-Zarr (plus its zipped variant), AnnData in Zarr (plus zipped and h5ad variants), and SpatialData in Zarr (plus zipped) — the same way you upload Gosling datasets. Each dataset is tagged with the viewer it belongs to, and the two don't mix inside a single visualization.
- The Add Dataset wizard now starts by asking whether you're adding data for Gosling or Vitessce, and then shows only the file types that viewer supports. For Vitessce, the file-type step is a two-step picker — choose a Data Type (matrix, embedding, image, …) first and the File Type dropdown narrows to just the formats that can carry it (per vitessce.io/docs/data-types-file-types).
- Drag a Vitessce-compatible dataset from the sidebar onto a Vitessce visualization to auto-generate a starter configuration. If the visualization already has a configuration, you'll be asked to confirm before it's replaced. Empty Vitessce visualizations show a hint pointing you at the drop area. Drag-and-drop is only enabled for the file formats Vitessce's automatic config generator supports — OME-TIFF, OME-Zarr, and AnnData-Zarr (see [Vitessce default config docs](https://vitessce.io/docs/default-config-json/)). Other formats can still be used by pasting a hand-written config into the code editor, and a banner above the data-source list on Vitessce visualizations spells this out.

### Changed
- A dataset can only be dragged into a visualization built for the same viewer — Gosling datasets to Gosling visualizations, Vitessce datasets to Vitessce visualizations.
- Vitessce file-type strings now match vitessce.js's canonical names — `image.ome-tiff` / `image.ome-zarr` (with the `image.` prefix) instead of the earlier `ome-tiff` / `ome-zarr`. A migration renames any existing rows so nothing needs to be re-uploaded.
- The Edit Dataset dialog handles Vitessce datasets: an editable Data Type dropdown appears alongside the locked File Type, and the dropdown only offers data types compatible with the file type (e.g., an OME-TIFF file's Data Type is always "image"; an AnnData Zarr can be any of the nine obs / feature / sample data types).
- The "Data Type" label on the locked file-type field in the Add and Edit dialogs is now "File Type" to match the field's actual meaning — "Data Type" is now a distinct, editable field for Vitessce datasets.
- Vitessce dataset `data_type` is now optional on the create-dataset API. The Add Dataset wizard still requires the user to pick a value, but non-wizard paths (a future cfdb → Vitessce import, direct API callers) can omit it and let the user fill it in via the Edit dialog later. Persisted as an empty string when absent.

