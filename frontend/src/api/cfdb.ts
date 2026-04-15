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

  return dccs.filter(Boolean);
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
    genomeAssembly
    fileFormat {
      id
      name
    }
    dcc {
      id
      dccName
    }
  }
}`;

export type CfdbFile = {
  localId: string;
  filename: string;
  accessUrl?: string | null;
  genomeAssembly?: string | null;
  fileFormat?: { id: string; name: string } | null;
  dcc: { id: string; dccName: string };
};

/** Maps CFDB file format IDs to Gosling file_type values */
export const CFDB_TO_GOSLING_FILE_TYPE: Record<string, string> = {
  "format:2572": "bam",
  "format:3003": "bed",
  "format:3006": "bigwig",
  "format:3016": "vcf",
  "format:3475": "csv",
};

export type CfdbFileFilters = {
  assemblies?: string[];
  fileFormatIds?: string[];
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
  if (filters?.fileFormatIds?.length) {
    input.fileFormat = filters.fileFormatIds.map((id) => ({ id: [id] }));
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
      pageSize: 500,
    });
    return data?.files ?? [];
  } catch {
    // Some DCCs have malformed data that causes server-side validation errors
    return [];
  }
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

export type CfdbFileFormat = {
  id: string;
  name: string;
  description?: string | null;
};

export function useCfdbDccFileFormats(dccName: string | undefined) {
  return useQuery({
    queryKey: ["cfdb", "dcc-file-formats", dccName],
    queryFn: async () => {
      const result = await fetchDistinctValues(dccName!, "file_format");
      return (result?.values as CfdbFileFormat[]) ?? [];
    },
    enabled: !!dccName,
    staleTime: 1000 * 60 * 10,
  });
}
