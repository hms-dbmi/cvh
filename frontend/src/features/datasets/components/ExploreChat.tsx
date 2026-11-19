import { useMemo } from "react";
import { UDIChat, type UDICohort, type UDIFilter } from "udi-yac";
import "udi-yac/style.css";
import { YAC_URL } from "@/features/profile/api/useYacAccess";

// YAC's cfdb package (yac/cfdb/yac-packages.json): one row per file, keyed by
// cfdb's local_id, the same ID Browse selects and adds to workspaces.
const PACKAGE = "cfdb";
const FILES = "Files";

// Loaded lazily: udi-yac bundles its own chart toolkit (~1.2 MB).
export default function ExploreChat({
  token,
  dcc,
  onFileIdsChange,
}: {
  token: string;
  // The library's short name as YAC stores it in Files.dcc ("ENCODE", "4DN").
  dcc: string;
  // Every file left by the filters, or null while no filter reaches Files.
  onFileIdsChange: (fileIds: string[] | null) => void;
}) {
  // A host filter scopes the chat to this library; the user sees it as a
  // chip but the agent can't remove it.
  const filters = useMemo<UDIFilter[]>(
    () => [
      {
        id: "dcc",
        dataSourceKey: FILES,
        type: "point",
        selection: { dcc: [dcc] },
      },
    ],
    [dcc],
  );

  return (
    <UDIChat
      apiBaseUrl={YAC_URL ?? ""}
      remotePackage={PACKAGE}
      authToken={token}
      allowApiKey={false}
      filters={filters}
      cohort={{ entity: FILES, fields: ["file_id"] }}
      onCohortChange={(cohort: UDICohort | null) =>
        onFileIdsChange(
          cohort ? cohort.keys.map((key) => String(key.file_id)) : null,
        )
      }
    />
  );
}
