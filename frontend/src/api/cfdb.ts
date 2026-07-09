import { useQuery } from "@tanstack/react-query";
import type { DccType, DistinctFieldType } from "../../cfdb-types";

const CFDB_API_URL = import.meta.env.VITE_CFDB_API_URL;

const DISTINCT_DCC_NAMES_QUERY = `{
  distinctValues(fields: ["dcc.dcc_name"]) {
    field
    values
  }
}`;

const DCC_DETAILS_QUERY = `query DccDetails($input: [FileMetadataInput!]) {
  files(input: $input, pageSize: 1) {
    dcc {
      id
      dccName
      dccDescription
    }
  }
}`;

async function fetchGraphQL(
  query: string,
  variables?: Record<string, unknown>,
) {
  const res = await fetch(`${CFDB_API_URL}/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`CFDB API error: ${res.status}`);
  }

  const json = await res.json();

  // GraphQL can return partial data alongside errors.
  // Only throw if there's no data at all.
  if (json.errors?.length && !json.data) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

async function fetchDccs(): Promise<DccType[]> {
  const data = await fetchGraphQL(DISTINCT_DCC_NAMES_QUERY);

  const distinctFields: DistinctFieldType[] = data?.distinctValues ?? [];
  const dccNames =
    (distinctFields.find((f) => f.field === "dcc.dcc_name")
      ?.values as string[]) ?? [];

  const dccs = await Promise.all(
    dccNames.map(async (name) => {
      try {
        const details = await fetchGraphQL(DCC_DETAILS_QUERY, {
          input: [{ dcc: [{ dccName: [name] }] }],
        });
        const file = details?.files?.[0];
        return file?.dcc as DccType;
      } catch {
        // Some DCCs have malformed data; skip them
        return null;
      }
    }),
  );

  return dccs.filter((d): d is DccType => d !== null);
}

export function useCfdbDccs() {
  return useQuery({
    queryKey: ["cfdb", "dccs"],
    queryFn: fetchDccs,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

const DCC_FILES_QUERY = `query DccFiles($input: [FileMetadataInput!], $pageSize: Int) {
  files(input: $input, pageSize: $pageSize) {
    localId
    filename
    accessUrl
    persistentId
    genomeAssembly
    fileFormat {
      id
      name
    }
    assayType {
      id
      name
    }
    collections {
      localId
      name
      abbreviation
      description
      experimentTarget
      persistentId
    }
    dcc {
      id
      dccName
      dccAbbreviation
    }
  }
}`;

// Large enough to cover any DCC's full file set in one request — until we
// add real pagination to the Browse Library UI.
const DCC_FILES_PAGE_SIZE = 10000;

export type CfdbCollection = {
  localId: string;
  name: string;
  abbreviation?: string | null;
  description?: string | null;
  experimentTarget?: string | null;
  // Resolvable URL to the collection's landing page on the DCC (e.g.
  // `https://www.encodeproject.org/experiments/ENCSR066LZB/`).
  persistentId?: string | null;
};

export type CfdbFile = {
  localId: string;
  filename: string;
  accessUrl?: string | null;
  // Resolvable URL pointing at the file's landing page on the DCC's own
  // portal (e.g. `https://www.encodeproject.org/files/ENCFF684QMZ/`).
  // Populated by cfdb across all DCCs we've observed.
  persistentId?: string | null;
  genomeAssembly?: string | null;
  fileFormat?: { id: string; name: string } | null;
  assayType?: { id: string; name: string } | null;
  collections?: CfdbCollection[] | null;
  dcc: { id: string; dccName: string; dccAbbreviation: string };
};

/**
 * Files in cfdb can belong to multiple collections but the catalog UI
 * displays a single value per column. Per the Public Data Catalogue
 * spec, we surface the first collection whose target field is populated
 * — otherwise we'd render blanks when the primary collection lacks a
 * value another sibling collection does have.
 */
export function firstCollectionWithField<K extends keyof CfdbCollection>(
  file: CfdbFile,
  key: K,
): CfdbCollection[K] | null {
  const value = file.collections?.find((c) => {
    const v = c[key];
    return typeof v === "string" && v.trim().length > 0;
  })?.[key];
  return value ?? null;
}

/**
 * The DCC-facing accession for a file. TEMPORARY: cfdb doesn't expose
 * a dedicated accession field, so we parse the last path segment of
 * `persistentId` — which contains the accession for the DCCs we ship
 * (ENCODE, 4DN). Falls back to `localId` when persistentId is missing
 * or unparseable. Remove this helper once cfdb surfaces the accession
 * directly.
 */
export function getFileAccession(file: CfdbFile): string {
  if (file.persistentId) {
    try {
      const path = new URL(file.persistentId).pathname.replace(/\/+$/, "");
      const last = path.split("/").filter(Boolean).pop();
      if (last) return last;
    } catch {
      // Malformed URL — fall through to localId.
    }
  }
  return file.localId;
}

/**
 * CFDB GraphQL returns DCC abbreviations in a different form than what
 * the `/data/{dcc}/...` REST endpoint accepts (e.g. GraphQL `4DN_DCIC`
 * → URL `4dn`). Maintain an explicit mapping rather than guessing —
 * add new DCCs here as the UI exposes them.
 */
const CFDB_DCC_URL_SLUG: Record<string, string> = {
  "4DN_DCIC": "4dn",
  ENCODE: "encode",
};

/**
 * The DCC slug used by CFDB's REST endpoints — `4DN_DCIC` → `4dn`, etc.
 * Sent to the CVH backend as `cfdb_dcc` so that backend `source_url`
 * derivation matches what the browser would have generated.
 */
export function getCfdbDccSlug(file: CfdbFile): string {
  return (
    CFDB_DCC_URL_SLUG[file.dcc.dccAbbreviation] ??
    file.dcc.dccAbbreviation.toLowerCase()
  );
}

/**
 * URL for fetching a CFDB file's bytes. Points at CFDB's
 * `/data/{dcc}/{local_id}` REST endpoint, with the DCC segment mapped
 * via `CFDB_DCC_URL_SLUG`.
 */
export function buildCfdbFileSourceUrl(file: CfdbFile): string {
  const dccSlug = getCfdbDccSlug(file);
  return `${CFDB_API_URL}/data/${encodeURIComponent(dccSlug)}/${encodeURIComponent(file.localId)}`;
}

/** Maps CFDB file format IDs to Gosling file_type values. */
export const CFDB_TO_GOSLING_FILE_TYPE: Record<string, string> = {
  "format:2572": "bam",
  "format:2573": "sam",
  "format:3003": "bed",
  "format:3004": "bigbed",
  "format:3006": "bigwig",
  "format:3016": "vcf",
  "format:1975": "gff3",
  "format:1939": "gff",
  "format:2306": "gtf",
  "format:3475": "csv",
};

/**
 * Gosling file_types that map cleanly to a "ready" GoslingDesigner
 * dataset (usable as-is, no server-side processing). Browse Library
 * sends these straight to the existing dataset-create endpoint.
 */
export const BROWSE_LIBRARY_READY_TYPES = [
  "bigwig",
  "vector",
  "cooler",
] as const;

export type BrowseLibraryReadyType =
  (typeof BROWSE_LIBRARY_READY_TYPES)[number];

export function isBrowseLibraryReadyType(
  value: string,
): value is BrowseLibraryReadyType {
  return (BROWSE_LIBRARY_READY_TYPES as readonly string[]).includes(value);
}

/**
 * Gosling file_types that require server-side processing via cfdb.
 * Browse Library passes `cfdb_dcc` + `cfdb_id` to the backend; the
 * backend derives `source_url`, the `Dataset.save()` hook flags the
 * row as `processing_status = "needed"`, and the user later triggers
 * processing manually.
 */
export const BROWSE_LIBRARY_PROCESSABLE_TYPES = [
  "bam",
  "sam",
  "vcf",
  "gff",
  "gff3",
  "gtf",
  "bed",
  "broadpeak",
  "narrowpeak",
  "bigbed",
] as const;

/**
 * Maps each cfdb-catalog file_type to the file_type Gosling actually
 * consumes once cfdb has finished processing. See the cfdb README's
 * processor table for the underlying conversions.
 *
 * The cfdb URL (`/data/{dcc}/{id}`) still references the *input* file —
 * cfdb's input→output translation is opaque to CVH — so this map only
 * affects what we persist in the Dataset row's `file_type` (i.e. what
 * Gosling reads).
 */
export const CFDB_PROCESSED_FILE_TYPE: Record<string, string> = {
  // Identity entries: cfdb only indexes these, doesn't rewrite the format.
  bam: "bam",
  vcf: "vcf",
  gff: "gff",
  bed: "bed",
  // SAM → BAM (cfdb converts SAM→BAM during indexing).
  sam: "bam",
  // GFF3 / GTF both end up as bgzipped GFF3, which the existing
  // GoslingDesignerIndex schema accepts as "gff".
  gff3: "gff",
  gtf: "gff",
  // BED-family formats all end up as bgzipped BED.
  broadpeak: "bed",
  narrowpeak: "bed",
  bigbed: "bed",
};

export type BrowseLibraryProcessableType =
  (typeof BROWSE_LIBRARY_PROCESSABLE_TYPES)[number];

export function isBrowseLibraryProcessableType(
  value: string,
): value is BrowseLibraryProcessableType {
  return (BROWSE_LIBRARY_PROCESSABLE_TYPES as readonly string[]).includes(
    value,
  );
}

/**
 * Whether a CFDB file's format maps to a Browse-Library-supported
 * Gosling file_type (ready or processable). Used to disable selection
 * on rows that would otherwise be skipped during dataset creation.
 */
export function isCfdbFileSupported(file: CfdbFile): boolean {
  const goslingType =
    file.fileFormat?.id && CFDB_TO_GOSLING_FILE_TYPE[file.fileFormat.id];
  if (!goslingType) return false;
  return (
    isBrowseLibraryReadyType(goslingType) ||
    isBrowseLibraryProcessableType(goslingType)
  );
}

export type CfdbFileFilters = {
  assemblies?: string[];
  fileFormatNames?: string[];
  search?: string;
};

function buildFileInput(
  dccName: string,
  filters?: CfdbFileFilters,
): Record<string, unknown>[] {
  const input: Record<string, unknown> = {
    dcc: [{ dccName: [dccName] }],
  };
  if (filters?.assemblies?.length) {
    input.genomeAssembly = filters.assemblies;
  }
  if (filters?.fileFormatNames?.length) {
    input.fileFormat = filters.fileFormatNames.map((name) => ({
      name: [name],
    }));
  }
  if (filters?.search) {
    input.filename = [filters.search];
  }
  return [input];
}

async function fetchDccFiles(
  dccName: string,
  filters?: CfdbFileFilters,
): Promise<CfdbFile[]> {
  try {
    const data = await fetchGraphQL(DCC_FILES_QUERY, {
      input: buildFileInput(dccName, filters),
      pageSize: DCC_FILES_PAGE_SIZE,
    });
    return data?.files ?? [];
  } catch {
    // Some DCCs have malformed data that causes server-side validation errors
    return [];
  }
}

async function fetchCfdbFilesByLocalIds(
  localIds: string[],
): Promise<CfdbFile[]> {
  if (localIds.length === 0) return [];
  try {
    const data = await fetchGraphQL(DCC_FILES_QUERY, {
      input: [{ localId: localIds }],
      pageSize: DCC_FILES_PAGE_SIZE,
    });
    return data?.files ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch CFDB files for a known set of `localId`s. Used by the "add to
 * project" flow because the user's selection can include files that
 * aren't in the currently-rendered page of `useCfdbDccFiles`, so we
 * can't rely on the cached list.
 */
export function fetchCfdbSelectedFiles(localIds: string[]) {
  return fetchCfdbFilesByLocalIds(localIds);
}

export function useCfdbDccFiles(
  dccName: string | undefined,
  filters?: CfdbFileFilters,
) {
  return useQuery({
    queryKey: ["cfdb", "dcc-files", dccName, filters],
    queryFn: () => fetchDccFiles(dccName!, filters),
    enabled: !!dccName,
    staleTime: 1000 * 60 * 10,
  });
}

const DISTINCT_VALUES_QUERY = `query DistinctValues($fields: [String!]!, $input: [FileMetadataInput!]) {
  distinctValues(fields: $fields, input: $input) {
    field
    values
  }
}`;

async function fetchDistinctValues(
  dccName: string,
  field: string,
): Promise<DistinctFieldType | null> {
  try {
    const data = await fetchGraphQL(DISTINCT_VALUES_QUERY, {
      fields: [field],
      input: [{ dcc: [{ dccName: [dccName] }] }],
    });
    const fields: DistinctFieldType[] = data?.distinctValues ?? [];
    return fields.find((f) => f.field === field) ?? null;
  } catch {
    return null;
  }
}

export function useCfdbDccAssemblies(dccName: string | undefined) {
  return useQuery({
    queryKey: ["cfdb", "dcc-assemblies", dccName],
    queryFn: async () => {
      const result = await fetchDistinctValues(dccName!, "genome_assembly");
      return (result?.values as string[]) ?? [];
    },
    enabled: !!dccName,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Snapshot of a cfdb processing job. Mirrors the shape documented in
 * cfdb's README for `GET /jobs/{id}`. We only consume the fields that
 * drive UI state transitions; cfdb may return more (progress, stage
 * names, etc.) but they are ignored here.
 */
export type CfdbJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "superseded";

export type CfdbJob = {
  status: CfdbJobStatus;
  progress?: number | null;
  error?: string | null;
  superseded_by?: string | null;
};

function isTerminalJob(job: CfdbJob): boolean {
  return job.status === "completed" || job.status === "failed";
}

async function fetchCfdbJob(jobId: string): Promise<CfdbJob> {
  const res = await fetch(`${CFDB_API_URL}/jobs/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    throw new Error(`CFDB job lookup failed: ${res.status}`);
  }
  return res.json();
}

/**
 * cfdb processing jobs typically take 20+ minutes; sub-minute polling
 * just burns network. Refetch every minute while in flight; mount /
 * tab-focus also triggers an immediate fetch via React Query's defaults,
 * so the user sees current state on page load without waiting a full
 * interval.
 */
const CFDB_JOB_POLL_INTERVAL_MS = 60 * 1000;

/**
 * Poll a cfdb processing job. The query auto-stops once the job reaches
 * a terminal state (complete or failed). Caller is responsible for
 * persisting the terminal state back to CVH via `useUpdateProcessingStatus`.
 *
 * Pass `enabled: false` when no job is in flight (status !== "started").
 */
export function useCfdbJob(
  jobId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const enabled = (options?.enabled ?? true) && Boolean(jobId);
  return useQuery({
    queryKey: ["cfdb", "job", jobId],
    queryFn: () => fetchCfdbJob(jobId as string),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data as CfdbJob | undefined;
      // Stop polling once we have a terminal state.
      if (data && isTerminalJob(data)) return false;
      return CFDB_JOB_POLL_INTERVAL_MS;
    },
    // staleTime: 0 so React Query always considers the data stale and
    // refetches on mount / tab focus / window reconnect. Combined with
    // the 2-minute interval, the user sees fresh status without waiting
    // for a full poll cycle when they open the page.
    staleTime: 0,
  });
}

export function useCfdbDccFileFormats(dccName: string | undefined) {
  return useQuery({
    queryKey: ["cfdb", "dcc-file-formats", dccName],
    queryFn: async () => {
      const result = await fetchDistinctValues(dccName!, "file_format.name");
      return (result?.values as string[]) ?? [];
    },
    enabled: !!dccName,
    staleTime: 1000 * 60 * 10,
  });
}
