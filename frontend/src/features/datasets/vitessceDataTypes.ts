/**
 * Vitessce data-type / file-type mapping.
 *
 * Vitessce distinguishes "data types" (abstract categories of what's
 * inside a file — matrix, embedding, image, etc.) from "file types"
 * (concrete on-disk schemas Vitessce knows how to read). One data type
 * can be carried by several file types; one file type (the "joint"
 * Zarr stores) can carry many data types simultaneously.
 *
 * The Add Dataset wizard uses this module to drive its two-dropdown
 * Vitessce step: user picks a Data Type first, and the File Type
 * dropdown filters to only file types that carry it.
 *
 * Source of truth: https://vitessce.io/docs/data-types-file-types/
 * and `FileType` in `@vitessce/constants-internal`. Strings here are
 * case-sensitive and must match vitessce's canonical values.
 */

export const VITESSCE_DATA_TYPES = [
  "image",
  "obsFeatureMatrix",
  "obsEmbedding",
  "obsSets",
  "obsLocations",
  "obsSpots",
  "obsPoints",
  "obsSegmentations",
  "obsLabels",
  "featureLabels",
  "sampleSets",
] as const;

export type VitessceDataType = (typeof VITESSCE_DATA_TYPES)[number];

// Friendlier labels for the dropdown; the identifier stays as the
// stored value (it's what Vitessce configs reference programmatically).
export const VITESSCE_DATA_TYPE_LABELS: Record<VitessceDataType, string> = {
  image: "Image (image)",
  obsFeatureMatrix: "Feature Matrix (obsFeatureMatrix)",
  obsEmbedding: "Embedding (obsEmbedding)",
  obsSets: "Observation Sets (obsSets)",
  obsLocations: "Observation Locations (obsLocations)",
  obsSpots: "Observation Spots (obsSpots)",
  obsPoints: "Observation Points (obsPoints)",
  obsSegmentations: "Observation Segmentations (obsSegmentations)",
  obsLabels: "Observation Labels (obsLabels)",
  featureLabels: "Feature Labels (featureLabels)",
  sampleSets: "Sample Sets (sampleSets)",
};

export const VITESSCE_DATA_TYPE_DESCRIPTIONS: Record<VitessceDataType, string> =
  {
    image:
      "Pixel data — microscopy channels, immunofluorescence, or any raster imagery.",
    obsFeatureMatrix:
      "Values (e.g., expression) for each observation × feature pair — the classic single-cell expression matrix.",
    obsEmbedding:
      "2D coordinates per observation from a dimensionality-reduction step (UMAP, t-SNE, PCA).",
    obsSets:
      "Groupings of observations — clusters, annotations, or hand-curated cell sets.",
    obsLocations:
      "Spatial coordinates for each observation in the sample's coordinate system.",
    obsSpots:
      "Spatially-resolved spot positions (e.g., Visium spots).",
    obsPoints:
      "Point clouds where each point represents a single observation.",
    obsSegmentations:
      "Segmentation masks that delineate observations in an image.",
    obsLabels: "Per-observation labels (e.g., cell type, sample id).",
    featureLabels: "Labels for each feature (e.g., gene symbols).",
    sampleSets: "Groupings of samples — e.g., experimental conditions.",
  };

// The set of file types the wizard exposes. Kept in sync with the
// backend's `VitessceDataset.file_type` Literal. Not exhaustive of
// vitessce's ~100 internal FileType constants — the internal
// data-type-suffixed variants (e.g. `obsEmbedding.anndata.zarr`) are
// reachable via their parent joint file (`anndata.zarr`), which is
// what a user typically brings when uploading.
export const VITESSCE_FILE_TYPES = [
  // Joint (multi-data-type) stores
  "anndata.zarr",
  "anndata.zarr.zip",
  "anndata.h5ad",
  "spatialdata.zarr",
  "spatialdata.zarr.zip",
  // Image
  "image.ome-tiff",
  "image.ome-zarr",
  "image.ome-zarr.zip",
  // Atomic CSV / JSON
  "obsEmbedding.csv",
  "obsFeatureMatrix.csv",
  "obsSets.csv",
  "obsSets.json",
  "obsSpots.csv",
  "obsPoints.csv",
  "obsLocations.csv",
  "obsLabels.csv",
  "featureLabels.csv",
  "sampleSets.csv",
  // Segmentations
  "obsSegmentations.json",
  "obsSegmentations.ome-zarr",
  "obsSegmentations.ome-zarr.zip",
] as const;

export type VitessceFileType = (typeof VITESSCE_FILE_TYPES)[number];

/**
 * File types that Vitessce's default-config generation
 * (`@vitessce/config`'s `generateConfig`) knows how to auto-configure
 * from just a URL — see https://vitessce.io/docs/default-config-json/.
 *
 * The Add Dataset wizard accepts a much broader set of Vitessce file
 * types (see `VITESSCE_FILE_TYPES` above), but drag-and-drop into a
 * Vitessce visualization requires the auto-config path to work, so
 * drops are restricted to this narrower list. Datasets in other
 * formats can still be referenced by pasting a hand-written config
 * into the code editor.
 */
export const VITESSCE_AUTO_CONFIG_FILE_TYPES = [
  "image.ome-tiff",
  "image.ome-zarr",
  "anndata.zarr",
] as const satisfies readonly VitessceFileType[];

export type VitessceAutoConfigFileType =
  (typeof VITESSCE_AUTO_CONFIG_FILE_TYPES)[number];

export function isVitessceAutoConfigFileType(
  value: string | null | undefined,
): value is VitessceAutoConfigFileType {
  return (VITESSCE_AUTO_CONFIG_FILE_TYPES as readonly string[]).includes(
    String(value ?? ""),
  );
}

/**
 * Reverse lookup: which Vitessce data types can be carried by a given
 * file type? Used in the Edit dialog where the file type is locked and
 * the Data Type dropdown must show only the compatible choices (an
 * OME-TIFF file's data type is always `image`; an `anndata.zarr` can
 * carry any of the ~9 obs-* / feature / sample data types).
 *
 * Computed by filtering `VITESSCE_DATA_TYPE_TO_FILE_TYPES` so the two
 * mappings can't drift.
 */
export function vitessceDataTypesForFileType(
  fileType: VitessceFileType,
): VitessceDataType[] {
  return VITESSCE_DATA_TYPES.filter((dt) =>
    (VITESSCE_DATA_TYPE_TO_FILE_TYPES[dt] as readonly string[]).includes(
      fileType,
    ),
  );
}

// File types that carry a given data type. Includes both atomic
// (single-data-type) files and the joint Zarr stores that carry many
// data types at once. Users can pick either from the File Type dropdown
// once they've chosen a Data Type.
export const VITESSCE_DATA_TYPE_TO_FILE_TYPES: Record<
  VitessceDataType,
  readonly VitessceFileType[]
> = {
  image: [
    "image.ome-tiff",
    "image.ome-zarr",
    "image.ome-zarr.zip",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  obsFeatureMatrix: [
    "obsFeatureMatrix.csv",
    "anndata.zarr",
    "anndata.zarr.zip",
    "anndata.h5ad",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  obsEmbedding: [
    "obsEmbedding.csv",
    "anndata.zarr",
    "anndata.zarr.zip",
    "anndata.h5ad",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  obsSets: [
    "obsSets.csv",
    "obsSets.json",
    "anndata.zarr",
    "anndata.zarr.zip",
    "anndata.h5ad",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  obsLocations: [
    "obsLocations.csv",
    "anndata.zarr",
    "anndata.zarr.zip",
    "anndata.h5ad",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  obsSpots: [
    "obsSpots.csv",
    "anndata.zarr",
    "anndata.zarr.zip",
    "anndata.h5ad",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  obsPoints: [
    "obsPoints.csv",
    "anndata.zarr",
    "anndata.zarr.zip",
    "anndata.h5ad",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  obsSegmentations: [
    "obsSegmentations.json",
    "obsSegmentations.ome-zarr",
    "obsSegmentations.ome-zarr.zip",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  obsLabels: [
    "obsLabels.csv",
    "anndata.zarr",
    "anndata.zarr.zip",
    "anndata.h5ad",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  featureLabels: [
    "featureLabels.csv",
    "anndata.zarr",
    "anndata.zarr.zip",
    "anndata.h5ad",
    "spatialdata.zarr",
    "spatialdata.zarr.zip",
  ],
  sampleSets: [
    "sampleSets.csv",
    "anndata.zarr",
    "anndata.zarr.zip",
    "anndata.h5ad",
  ],
};
