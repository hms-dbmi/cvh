import { useQuery } from "@tanstack/react-query";
import type { DccType } from "../../cfdb-types";

const CFDB_API_URL = import.meta.env.VITE_CFDB_API_URL;

const DCCS_QUERY = `{
  files(pageSize: 500) {
    dcc {
      id
      dccName
      dccAbbreviation
      dccDescription
      dccUrl
    }
  }
}`;

async function fetchDccs(): Promise<DccType[]> {
  const res = await fetch(`${CFDB_API_URL}/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: DCCS_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`CFDB API error: ${res.status}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  const files: { dcc: DccType }[] = json.data?.files ?? [];
  const dccMap = new Map<string, DccType>();
  for (const file of files) {
    if (!dccMap.has(file.dcc.id)) {
      dccMap.set(file.dcc.id, file.dcc);
    }
  }
  return Array.from(dccMap.values());
}

export function useCfdbDccs() {
  return useQuery({
    queryKey: ["cfdb", "dccs"],
    queryFn: fetchDccs,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
