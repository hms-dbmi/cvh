/**
 * Translation from cfdb's assembly vocabulary to what Gosling consumes.
 *
 * Gosling's track `assembly` field accepts either a built-in name (hg38,
 * hg19, etc.) or an explicit `ChromSizes` array. For cfdb assemblies that
 * Gosling doesn't have built-in support for (fly, worm, T2T human), we
 * ship the chromsizes inline — sourced from UCSC's public chrom.sizes
 * files, filtered to primary chromosomes (alt contigs / random / Un are
 * intentionally excluded so the chromosome ideogram stays clean).
 *
 * The CVH `Dataset.assembly` column stores cfdb's raw value as-is so we
 * don't lose information; the helper below translates it at the seam
 * where Gosling consumes the field.
 */

/** Mirrors `gosling.js`'s `ChromSizes` type: `[chromosome_name, size][]`. */
export type ChromSizes = [string, number][];

/** Assembly names Gosling has built-in chromsizes for. */
type BuiltinAssembly =
  | "hg38"
  | "hg19"
  | "hg18"
  | "hg17"
  | "hg16"
  | "mm10"
  | "mm9"
  | "unknown";

export type GoslingTrackAssembly = BuiltinAssembly | ChromSizes;

const BUILTIN_ASSEMBLIES = new Set<string>([
  "hg38",
  "hg19",
  "hg18",
  "hg17",
  "hg16",
  "mm10",
  "mm9",
  "unknown",
]);

/**
 * Aliases for assemblies that are sequence-equivalent to a Gosling-known
 * one under a different name. The GRC ↔ UCSC equivalences are documented
 * by both the Genome Reference Consortium and UCSC. The `-minimal`
 * variants are ENCODE-style primary-chromosome subsets — primary-contig
 * coordinates are identical to the full assembly.
 */
const ASSEMBLY_ALIASES: Record<string, BuiltinAssembly> = {
  GRCh38: "hg38",
  "GRCh38-minimal": "hg38",
  GRCm38: "mm10",
  "mm10-minimal": "mm10",
};

/**
 * Chromsizes for assemblies Gosling doesn't have built-in support for.
 * Sourced from UCSC's `hgdownload.soe.ucsc.edu/goldenPath/{db}/bigZips/
 * {db}.chrom.sizes`, filtered to primary chromosomes (chr2L/2R/3L/3R/4/X/Y/M
 * for fly; chrI–V/X/M for worm; chr1–22/X/Y/M for T2T).
 */
const CHROMSIZES_TABLE: Record<string, ChromSizes> = {
  // Drosophila melanogaster — UCSC dm6 (2014).
  dm6: [
    ["chr2L", 23513712],
    ["chr2R", 25286936],
    ["chr3L", 28110227],
    ["chr3R", 32079331],
    ["chr4", 1348131],
    ["chrX", 23542271],
    ["chrY", 3667352],
    ["chrM", 19524],
  ],
  // Drosophila melanogaster — UCSC dm3 (2006). Note: dm3 has no canonical
  // chrY (only chrYHet, which is heterochromatin and filtered).
  dm3: [
    ["chr2L", 23011544],
    ["chr2R", 21146708],
    ["chr3L", 24543557],
    ["chr3R", 27905053],
    ["chr4", 1351857],
    ["chrX", 22422827],
    ["chrM", 19517],
  ],
  // Caenorhabditis elegans — UCSC ce11 (2013).
  ce11: [
    ["chrI", 15072434],
    ["chrII", 15279421],
    ["chrIII", 13783801],
    ["chrIV", 17493829],
    ["chrV", 20924180],
    ["chrX", 17718942],
    ["chrM", 13794],
  ],
  // Caenorhabditis elegans — UCSC ce10 (2010).
  ce10: [
    ["chrI", 15072423],
    ["chrII", 15279345],
    ["chrIII", 13783700],
    ["chrIV", 17493793],
    ["chrV", 20924149],
    ["chrX", 17718866],
    ["chrM", 13794],
  ],
  // Telomere-to-Telomere human assembly — UCSC hs1 (T2T-CHM13v2.0, 2022).
  // Different coordinate system from GRCh38; not an alias.
  "T2T-CHM13": [
    ["chr1", 248387328],
    ["chr2", 242696752],
    ["chr3", 201105948],
    ["chr4", 193574945],
    ["chr5", 182045439],
    ["chr6", 172126628],
    ["chr7", 160567428],
    ["chr8", 146259331],
    ["chr9", 150617247],
    ["chr10", 134758134],
    ["chr11", 135127769],
    ["chr12", 133324548],
    ["chr13", 113566686],
    ["chr14", 101161492],
    ["chr15", 99753195],
    ["chr16", 96330374],
    ["chr17", 84276897],
    ["chr18", 80542538],
    ["chr19", 61707364],
    ["chr20", 66210255],
    ["chr21", 45090682],
    ["chr22", 51324926],
    ["chrX", 154259566],
    ["chrY", 62460029],
    ["chrM", 16569],
  ],
};

/**
 * Translate a stored assembly value to something a Gosling track can
 * consume. Returns the original string when Gosling has built-in support;
 * an aliased name when the value is a sequence-equivalent of a built-in;
 * an inline ChromSizes array when we ship our own; "unknown" otherwise.
 */
export function toGoslingAssembly(
  raw: string | null | undefined,
): GoslingTrackAssembly {
  if (!raw) return "unknown";
  if (BUILTIN_ASSEMBLIES.has(raw)) return raw as BuiltinAssembly;
  if (raw in ASSEMBLY_ALIASES) return ASSEMBLY_ALIASES[raw];
  if (raw in CHROMSIZES_TABLE) return CHROMSIZES_TABLE[raw];
  return "unknown";
}
