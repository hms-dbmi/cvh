import {
  isVitessceAutoConfigFileType,
  VITESSCE_AUTO_CONFIG_FILE_TYPES,
  VITESSCE_DATA_TYPE_TO_FILE_TYPES,
  VITESSCE_DATA_TYPES,
  VITESSCE_FILE_TYPES,
  vitessceDataTypesForFileType,
} from "./vitessceDataTypes";

describe("vitessceDataTypes", () => {
  describe("VITESSCE_DATA_TYPE_TO_FILE_TYPES", () => {
    it("has an entry for every declared data type", () => {
      const covered = new Set(
        Object.keys(VITESSCE_DATA_TYPE_TO_FILE_TYPES),
      );
      for (const dt of VITESSCE_DATA_TYPES) {
        expect(covered.has(dt)).toBe(true);
      }
    });

    it("only references file types that also appear in VITESSCE_FILE_TYPES", () => {
      // Guards against drift — if we add a data-type-specific file type
      // to the mapping but forget it in the enum (or vice versa), Zod
      // and TS will lie about what the wizard renders.
      const known = new Set<string>(VITESSCE_FILE_TYPES);
      for (const [dt, fts] of Object.entries(
        VITESSCE_DATA_TYPE_TO_FILE_TYPES,
      )) {
        for (const ft of fts) {
          expect(known.has(ft), `${dt} references unknown file type ${ft}`).toBe(
            true,
          );
        }
      }
    });
  });

  describe("vitessceDataTypesForFileType", () => {
    it("returns only 'image' for OME-TIFF (single-data-type file)", () => {
      expect(vitessceDataTypesForFileType("image.ome-tiff")).toEqual(["image"]);
    });

    it("returns multiple data types for anndata.zarr (joint file)", () => {
      const result = vitessceDataTypesForFileType("anndata.zarr");
      // anndata.zarr carries many obs-* and feature/sample data types
      // but is not an image.
      expect(result).toContain("obsFeatureMatrix");
      expect(result).toContain("obsEmbedding");
      expect(result).toContain("obsSets");
      expect(result).not.toContain("image");
    });

    it("returns only 'obsSegmentations' for a segmentation-specific file", () => {
      expect(vitessceDataTypesForFileType("obsSegmentations.ome-zarr")).toEqual(
        ["obsSegmentations"],
      );
    });
  });

  describe("isVitessceAutoConfigFileType", () => {
    it("accepts only the three auto-config-supported formats", () => {
      expect(isVitessceAutoConfigFileType("image.ome-tiff")).toBe(true);
      expect(isVitessceAutoConfigFileType("image.ome-zarr")).toBe(true);
      expect(isVitessceAutoConfigFileType("anndata.zarr")).toBe(true);
    });

    it("rejects zipped variants of the auto-config formats", () => {
      // Vitessce's default-config generator (as of the docs referenced in
      // vitessceDataTypes.ts) does not walk .zip archives — so these are
      // intentionally excluded from the auto-config set even though the
      // wizard accepts them for hand-written configs.
      expect(isVitessceAutoConfigFileType("image.ome-zarr.zip")).toBe(false);
      expect(isVitessceAutoConfigFileType("anndata.zarr.zip")).toBe(false);
    });

    it("rejects gosling file types, unknown strings, and nullish input", () => {
      expect(isVitessceAutoConfigFileType("bigwig")).toBe(false);
      expect(isVitessceAutoConfigFileType("")).toBe(false);
      expect(isVitessceAutoConfigFileType(null)).toBe(false);
      expect(isVitessceAutoConfigFileType(undefined)).toBe(false);
    });

    it("only surfaces file types that are also in VITESSCE_FILE_TYPES", () => {
      // Auto-config subset shouldn't include a value that's not a
      // registered Vitessce file type — otherwise the wizard couldn't
      // produce one to begin with.
      const known = new Set<string>(VITESSCE_FILE_TYPES);
      for (const ft of VITESSCE_AUTO_CONFIG_FILE_TYPES) {
        expect(known.has(ft)).toBe(true);
      }
    });
  });
});
