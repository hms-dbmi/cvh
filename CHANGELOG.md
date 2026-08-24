# Changelog

All notable changes to CVH (backend + frontend) are recorded here. Follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

The [`[Unreleased]`](#unreleased) section lists what's merged to `main` and running on **dev** but not yet on **prod**. When a prod deploy happens, the deploy workflow renames `[Unreleased]` to a dated block below and starts a fresh `[Unreleased]` section, so answering "what's on dev but not prod?" is always "read the `[Unreleased]` section."

The `python-client/` package tracks its own history in [`python-client/CHANGELOG.md`](./python-client/CHANGELOG.md) because it ships to TestPyPI on its own release rhythm, decoupled from prod deploys.

Categories per Keep a Changelog: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**.

## [Unreleased]

## [2026-08-20] (prod, d1d891f)

### Added
- Vitessce visualizations can now use CVH datasets. Upload Vitessce-native formats — OME-TIFF, OME-Zarr (plus its zipped variant), AnnData in Zarr (plus zipped and h5ad variants), and SpatialData in Zarr (plus zipped) — the same way you upload Gosling datasets. Each dataset is tagged with the viewer it belongs to, and the two don't mix inside a single visualization.
- The Add Dataset wizard now starts by asking whether you're adding data for Gosling or Vitessce, and then shows only the file types that viewer supports. For Vitessce, the file-type step is a two-step picker — choose a Data Type (matrix, embedding, image, …) first and the File Type dropdown narrows to just the formats that can carry it (per vitessce.io/docs/data-types-file-types).
- Drag a Vitessce-compatible dataset from the sidebar onto a Vitessce visualization to auto-generate a starter configuration. If the visualization already has a configuration, you'll be asked to confirm before it's replaced. Empty Vitessce visualizations show a hint pointing you at the drop area. Drag-and-drop is only enabled for the file formats Vitessce's automatic config generator supports — OME-TIFF, OME-Zarr, and AnnData-Zarr (see [Vitessce default config docs](https://vitessce.io/docs/default-config-json/)). Other formats can still be used by pasting a hand-written config into the code editor, and a banner above the data-source list on Vitessce visualizations spells this out.
- Homepage now includes a "What is the Community Visualization Hub?" section between the hero and the features grid, describing who the platform is for and what it does, with a link to the [Common Fund Data Ecosystem](https://commonfund.nih.gov/dataecosystem).
- A "Beta" chip now sits next to the "Community Visualization Hub" wordmark in the header, signalling that the product is still in active development. Rendered in every header state (unauthenticated, authenticated no workspace, authenticated inside a workspace).
- Three new Gosling tutorials: "Your first visualization" (creating a visualization, loading example data sources, dragging a bigwig track onto the canvas, and swapping the mark and colormap via track templates and the Visual Mapping panel), "Creating a multi-view visualization" (adding a second view, overlaying tracks, and linking two views into an overview-plus-detail with a brush), and "Reusing an existing Gosling spec" (pasting a Circos example from the online editor and adapting it). Each tutorial ships with screenshots.
- Tutorial sidebar groups tutorials under section headings ("Gosling"), so the list stays organized as more tutorials are added. Ungrouped tutorials sit at the top of the sidebar above the first named section.

### Changed
- A dataset can only be dragged into a visualization built for the same viewer — Gosling datasets to Gosling visualizations, Vitessce datasets to Vitessce visualizations.
- Vitessce file-type strings now match vitessce.js's canonical names — `image.ome-tiff` / `image.ome-zarr` (with the `image.` prefix) instead of the earlier `ome-tiff` / `ome-zarr`. A migration renames any existing rows so nothing needs to be re-uploaded.
- The Edit Dataset dialog handles Vitessce datasets: an editable Data Type dropdown appears alongside the locked File Type, and the dropdown only offers data types compatible with the file type (e.g., an OME-TIFF file's Data Type is always "image"; an AnnData Zarr can be any of the nine obs / feature / sample data types).
- The "Data Type" label on the locked file-type field in the Add and Edit dialogs is now "File Type" to match the field's actual meaning — "Data Type" is now a distinct, editable field for Vitessce datasets.
- Vitessce dataset `data_type` is now optional on the create-dataset API. The Add Dataset wizard still requires the user to pick a value, but non-wizard paths (a future cfdb → Vitessce import, direct API callers) can omit it and let the user fill it in via the Edit dialog later. Persisted as an empty string when absent.
- Browse Library's Quick Dataset ID Lookup now filters by `accessionId` (file) and `collections.accessionId` (experiment/collection), so pasting an accession like `ENCFF525XQX` or `ENCSR918ZSJ` returns the expected match. The lookup previously matched cfdb's internal `localId` and `filename` fields, which no longer align with the accession IDs users see in DCC portals.
- Browse Library's DCC file listing paginates through cfdb 500 rows at a time and loads the next page as the user scrolls the virtualized table. Previously the UI requested a single 10,000-row page, which cfdb no longer accepts and which capped visibility to a small fraction of large catalogs (ENCODE alone has ~230k files).
- Quick Dataset ID Lookup placeholder now shows sample accession IDs for the DCC currently being browsed (e.g. `4DNFIILS2P5P` / `4DNEXYB8YD4K` for 4DN, `ENCFF525XQX` / `ENCSR918ZSJ` for ENCODE), replacing the earlier ENCODE-only example.
- The header's "Return to Workspaces" link (shown to authenticated users on the homepage) now leads with a return-arrow icon and drops the underline for a lighter, more button-like treatment.

### Fixed
- Browse Library rendered an empty DCC file listing after cfdb wrapped its `files(...)` responses in a `FileList { totalCount, items }` object and capped `pageSize` at 500. The frontend now tolerates both the new and pre-refactor response shapes and requests pages within the enforced cap.
- Homepage Featured Visualizations grid no longer silently truncates the `featured.json` list to the first five entries. The first two still render as half-width hero tiles, and any additional entries flow into rows of three third-width tiles below, so new items added to `featured.json` show up on the homepage as expected.
- Bullet lists in tutorials render with visible markers again. The global Tailwind Preflight reset had been stripping `list-style` from every `<ul>` on the site, which silently hid the tutorial article's list bullets; the tutorial renderer now sets `listStyleType: disc` explicitly on its lists.

