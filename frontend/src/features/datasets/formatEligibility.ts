/**
 * Format-eligibility map: which dataset file types require server-side
 * processing via the cfdb workflow, and which processor handles each.
 *
 * Mirrored from `backend/core/api/format_eligibility.py`. When cfdb adds a
 * processable format, update both files in the same PR.
 */

export type Processor = "bam_index" | "tabix_interval";

export type FileType =
  // Ready as-is (no processing).
  | "bigwig"
  | "vector"
  | "cooler"
  | "multivec"
  | "beddb"
  | "csv"
  // Processable.
  | "bam"
  | "sam"
  | "vcf"
  | "gff"
  | "gff3"
  | "gtf"
  | "bed"
  | "broadpeak"
  | "narrowpeak"
  | "bigbed";

export const PROCESSABLE_FORMATS: Partial<Record<FileType, Processor>> = {
  bam: "bam_index",
  sam: "bam_index",
  vcf: "tabix_interval",
  gff: "tabix_interval",
  gff3: "tabix_interval",
  gtf: "tabix_interval",
  bed: "tabix_interval",
  broadpeak: "tabix_interval",
  narrowpeak: "tabix_interval",
  bigbed: "tabix_interval",
};

export function isProcessable(fileType: string): boolean {
  return fileType.toLowerCase() in PROCESSABLE_FORMATS;
}

/**
 * Processing state on a Dataset row. Mirrors the Django
 * `Dataset.ProcessingStatus` TextChoices.
 */
export type ProcessingStatus =
  | "not_needed"
  | "needed"
  | "started"
  | "processed"
  | "failed";
