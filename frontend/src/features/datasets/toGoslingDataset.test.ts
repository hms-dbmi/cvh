import { toGoslingDataset } from "./toGoslingDataset";

// Type shim — the Dataset shape defined in schema.d.ts has
// `data_column` narrowed to `Record<string, never>` by openapi-
// typescript (since Django Ninja emits `dict` for it), which rejects
// the field-tuple arrays the tests need to pass in. Using a loose
// override type here lets tests feed realistic values.
type Dataset = Parameters<typeof toGoslingDataset>[0];

function makeDataset(overrides: Record<string, unknown>): Dataset {
  return {
    uuid: "test-uuid",
    name: "Test dataset",
    description: null,
    source_url: "https://example.com/data",
    file_type: "bigwig",
    data_type: "",
    assembly: "hg38",
    data_column: null,
    row_names: null,
    headers: false,
    index_url: null,
    separator: null,
    cfdb_dcc: null,
    cfdb_id: null,
    processing_status: "not_needed",
    processing_job_id: null,
    processing_started_at: null,
    processing_completed_at: null,
    processing_error: null,
    created_timestamp: "2026-01-01T00:00:00Z",
    modified_timestamp: "2026-01-01T00:00:00Z",
    last_viewed_timestamp: "2026-01-01T00:00:00Z",
    tags: [],
    ...overrides,
  } as unknown as Dataset;
}

describe("toGoslingDataset", () => {
  it("carries url, assembly, and tags through unchanged", () => {
    const out = toGoslingDataset(
      makeDataset({
        source_url: "https://example.com/track.bw",
        assembly: "hg38",
        tags: [{ tag: "H3K4me3", key: "assay", uuid: "t1" }],
      }),
    ) as unknown as Record<string, unknown>;

    expect(out.url).toBe("https://example.com/track.bw");
    expect(out.assembly).toBe("hg38");
    expect(out.tags).toEqual([["assay", "H3K4me3"]]);
  });

  it("passes indexURL through for indexed formats", () => {
    const out = toGoslingDataset(
      makeDataset({
        file_type: "bam",
        index_url: "https://example.com/track.bam.bai",
      }),
    ) as unknown as Record<string, unknown>;

    expect(out.indexURL).toBe("https://example.com/track.bam.bai");
  });

  it("passes rowNames through for multivec", () => {
    const out = toGoslingDataset(
      makeDataset({
        file_type: "multivec",
        row_names: ["sample1", "sample2"],
      }),
    ) as unknown as Record<string, unknown>;

    expect(out.rowNames).toEqual(["sample1", "sample2"]);
  });

  describe("CSV datasets", () => {
    it("maps data_column to fields, not optionalFields", () => {
      const out = toGoslingDataset(
        makeDataset({
          file_type: "csv",
          separator: ",",
          headers: true,
          data_column: [
            ["chrom", "chromosome"],
            ["start", "genomic"],
            ["end", "genomic"],
          ],
        }),
      ) as unknown as Record<string, unknown>;

      expect(out.fields).toEqual([
        ["chrom", "chromosome"],
        ["start", "genomic"],
        ["end", "genomic"],
      ]);
      expect(out.optionalFields).toBeUndefined();
    });

    it("passes separator and header through for CSV", () => {
      const out = toGoslingDataset(
        makeDataset({
          file_type: "csv",
          separator: "\t",
          headers: true,
          data_column: [["chrom", "chromosome"]],
        }),
      ) as unknown as Record<string, unknown>;

      expect(out.separator).toBe("\t");
      expect(out.header).toBe(true);
    });

    // The important one — this is the class of bug that took down the
    // BEDPE example. chrToGenomicFields is required by MRi (the drop
    // handler in gosling-designer-vec) but not computed by the drag
    // payload originally.
    it("computes chrToGenomicFields for single-chromosome CSVs", () => {
      const out = toGoslingDataset(
        makeDataset({
          file_type: "csv",
          data_column: [
            ["chrom", "chromosome"],
            ["start", "genomic"],
            ["end", "genomic"],
            ["signal", "quantitative"],
          ],
        }),
      ) as unknown as Record<string, unknown>;

      expect(out.chrToGenomicFields).toEqual({
        chrom: ["start", "end"],
      });
    });

    it("computes chrToGenomicFields for BEDPE-style paired chromosomes", () => {
      const out = toGoslingDataset(
        makeDataset({
          file_type: "csv",
          data_column: [
            ["chrom1", "chromosome"],
            ["start1", "genomic"],
            ["end1", "genomic"],
            ["chrom2", "chromosome"],
            ["start2", "genomic"],
            ["end2", "genomic"],
            ["sv_id", "key"],
            ["strand1", "nominal"],
          ],
        }),
      ) as unknown as Record<string, unknown>;

      expect(out.chrToGenomicFields).toEqual({
        chrom1: ["start1", "end1"],
        chrom2: ["start2", "end2"],
      });
    });

    it("omits chrToGenomicFields when data_column has no chromosome field", () => {
      const out = toGoslingDataset(
        makeDataset({
          file_type: "csv",
          data_column: [
            ["signal", "quantitative"],
            ["label", "nominal"],
          ],
        }),
      ) as unknown as Record<string, unknown>;

      expect(out.chrToGenomicFields).toBeUndefined();
    });

    it("stops collecting genomic fields when a non-genomic field appears", () => {
      const out = toGoslingDataset(
        makeDataset({
          file_type: "csv",
          data_column: [
            ["chrom", "chromosome"],
            ["start", "genomic"],
            ["label", "nominal"],
            ["end", "genomic"],
          ],
        }),
      ) as unknown as Record<string, unknown>;

      // Only picks up `start` — the interruption by `label` breaks
      // the chain. This documents the current algorithm's behavior;
      // if it changes, the test needs updating.
      expect(out.chrToGenomicFields).toEqual({ chrom: ["start"] });
    });
  });

  it("passes data_column as optionalFields for non-CSV tabular formats", () => {
    const out = toGoslingDataset(
      makeDataset({
        file_type: "bed",
        data_column: [["extra_col", "quantitative"]],
      }),
    ) as unknown as Record<string, unknown>;

    expect(out.optionalFields).toEqual([["extra_col", "quantitative"]]);
    expect(out.fields).toBeUndefined();
  });
});
