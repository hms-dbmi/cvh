# Changelog

All notable changes to CVH (backend + frontend) are recorded here. Follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

The [`[Unreleased]`](#unreleased) section lists what's merged to `main` and running on **dev** but not yet on **prod**. When a prod deploy happens, the deploy workflow renames `[Unreleased]` to a dated block below and starts a fresh `[Unreleased]` section, so answering "what's on dev but not prod?" is always "read the `[Unreleased]` section."

The `python-client/` package tracks its own history in [`python-client/CHANGELOG.md`](./python-client/CHANGELOG.md) because it ships to TestPyPI on its own release rhythm, decoupled from prod deploys.

Categories per Keep a Changelog: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**.

## [Unreleased]

### Added
- Vitessce visualizations have a Save button in the bottom bar (exploring mode). Edits made through Vitessce's own UI — brushes, layout toggles, selection changes — are tracked as unsaved and persisted only when you click Save. The button disables once there's nothing left to save.
- PostHog product analytics wired up with prod-vs-dev isolation on the free-tier single-project constraint. The SDK only initializes when `VITE_ENVIRONMENT=production` (or the explicit `VITE_POSTHOG_DEBUG=true` escape hatch for preview deploys), and every captured event carries an `environment` super-property so any non-prod traffic that does land can be filtered out at the project level. Session-replay input capture is now masked by default (`maskAllInputs`) so form fields — including the Vitessce/Gosling code editor and Quick Dataset ID Lookup — don't stream verbatim into recordings. Events fired inside a workspace context also tag the current workspace via `posthog.group("workspace", ...)`, so analytics can be sliced per-workspace.

### Changed
- Gosling visualizations now use a manual Save workflow instead of the previous 5-second debounced autosave. Panel edits, drags, template drops, and other in-canvas changes all light up the Save button; click Save to persist. Pasting a spec into the code editor still autosaves immediately, since that's already an explicit user action.

### Fixed
- Editing a Gosling visualization no longer intermittently reverts the canvas back to the last saved state on the first change after each save.
- Undo history in the Gosling designer is preserved across save cycles. Previously the first edit after each save wiped the undo stack.
- Hovering over a track template thumbnail or a Visual Mapping mark icon no longer triggers a full canvas re-render on every mouse-enter, keeping the panels responsive on large visualizations. Panel highlight outlines (green for the newly-selected mark, orange for the deselected mark) still work as before.
- Pasting a spec into the Gosling code editor no longer leaves stale canvas state from the previous spec when the pasted spec has a different track or view structure.

## [2026-08-26] (prod, df5601f)

### Fixed
- Vitessce visualization pages no longer freeze the browser tab while loading. The Vitessce runtime (~9 MB of JS, including three.js, higlass, and neuroglancer) is now downloaded and parsed only when the canvas is about to render — the code editor, drop zone, and bottom bar appear immediately, and a "Loading viewer…" placeholder occupies the canvas region while the runtime hydrates. In editing mode the Vitessce runtime doesn't load at all unless the user switches to exploring or saves.
- Frontend deploys now propagate on the next page load instead of only after a hard-refresh. The dev and prod deploy workflows set `Cache-Control` at upload time (`no-cache, must-revalidate` on `index.html`; long-lived `immutable` on Vite's content-hashed asset chunks), so the browser stops using heuristic caching and reliably picks up the new bundle after each deploy.
### Added
- Hidden `/changelog` page renders `CHANGELOG.md` for users who navigate to the URL directly. Prod hides the `[Unreleased]` section (dev and local dev show both released and unreleased entries alongside each other). Not linked from any UI; discoverable by typing the URL.
- Workspace switcher splits the workspaces list into **Current Workspace**, **Personal Workspaces** (created by you), and **Shared Workspaces** (created by someone else and shared with you). Each shared tile — including the Current Workspace tile when the active workspace was created by someone else — includes a `Shared By: <name>` line so the user knows who invited them. The name falls back to the creator's email when they haven't set a first/last name yet (so users who signed in via Auth0 without editing their profile show as `Shared By: user@example.com` rather than an opaque `auth0_<hex>` id). A search input filters by workspace name and a "From Me" filter chip (shown only when you actually have shared workspaces) hides the shared section.
- Workspace API responses now include a `created_by: { username, first_name, last_name, email }` field on each workspace, sourced from the workspace's creator (`Project.user_key`). Nullable for legacy rows created before the field was tracked.

### Changed
- Collaborator counts across the app now represent "collaborators besides you." The workspace switcher's per-workspace count subtracts the viewer (so a workspace you created and haven't shared shows no collaborator line at all instead of "1 collaborator"), and the "N Collaborators" button in the workspace sharing dialog uses the same rule (showing `0 Collaborators` on a solo workspace so the button keeps stable width).
- Workspace tiles in the switcher now show a Phosphor `User` icon (1 total member) or `Users` icon (>1) inside the colored avatar square instead of the workspace's initial letter. The trigger button that opens the switcher uses the same icon for consistency with the tiles it opens.

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

