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
