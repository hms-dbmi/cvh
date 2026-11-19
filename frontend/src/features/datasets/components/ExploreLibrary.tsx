import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import {
  fetchCfdbSelectedFiles,
  getDccShortName,
  isCfdbFileSupported,
} from "@/api/cfdb";
import {
  useGetYacAccess,
  useYacToken,
  useYacUsage,
} from "@/features/profile/api/useYacAccess";
import {
  NEAR_LIMIT_PERCENT,
  useAiUsageContent,
} from "@/features/profile/components/AiUsage";
import type { DccType } from "../../../../cfdb-types";
import { DatasetRow, FileTableHead } from "./CfdbFileTable";

const ExploreChat = lazy(() => import("./ExploreChat"));

// Selecting from more files than this isn't useful; ask for more filters.
export const MAX_EXPLORE_FILES = 100;

const noop = () => {};

export function plural(count: number, noun: string) {
  return `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;
}

// The bottom bar while finding files: how many the filters leave, and whether
// that's few enough to pick from. Nothing to say until a filter reaches Files.
export function exploreSummary(fileIds: string[] | null) {
  if (fileIds === null) return { label: null, canContinue: false };
  const matched = fileIds.length;
  return {
    label:
      matched > MAX_EXPLORE_FILES
        ? `${plural(matched, "File")} Matched · Filter to ${MAX_EXPLORE_FILES} or fewer to select files`
        : `${plural(matched, "File")} Matched`,
    canContinue: matched > 0 && matched <= MAX_EXPLORE_FILES,
  };
}

function Loading() {
  return (
    <Stack alignItems="center" py={4}>
      <CircularProgress />
    </Stack>
  );
}

// Explore: ask YAC about the library, narrow it with charts and filters, then
// pick from the files left (`selectingIds`, set by the dialog's bottom bar).
export default function ExploreLibrary({
  dcc,
  selectingIds,
  onFileIdsChange,
  selectedIds,
  setSelectedIds,
}: {
  dcc: DccType;
  selectingIds: string[] | null;
  onFileIdsChange: (fileIds: string[] | null) => void;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const { data: access } = useGetYacAccess();
  const approved = access?.status === "approved";
  const { data: usage, error: usageError } = useYacUsage(approved);
  const { data: token } = useYacToken(approved);
  const aiContent = useAiUsageContent();

  // Not approved, a sign-in or usage problem, or near the monthly limit: the
  // profile's banner says what's going on and what to do.
  const showBanner =
    !approved ||
    !!usageError ||
    (usage !== undefined && usage.percent_used >= NEAR_LIMIT_PERCENT);

  // Still loading, or the request failed (the profile content says so).
  if (!access) return aiContent?.body ?? <Loading />;

  return (
    <Stack spacing={2} sx={{ height: "100%" }}>
      {showBanner && aiContent?.body}
      {approved && !token && !usageError && <Loading />}
      {approved && token && (
        // Hidden rather than unmounted while selecting files, so going back
        // keeps the conversation and charts.
        <Box
          sx={{
            display: selectingIds === null ? "block" : "none",
            flex: 1,
            minHeight: 560,
          }}
        >
          <Suspense fallback={<Loading />}>
            <ExploreChat
              token={token}
              dcc={getDccShortName(dcc)}
              onFileIdsChange={onFileIdsChange}
            />
          </Suspense>
        </Box>
      )}
      {selectingIds && (
        <ExploreFileTable
          fileIds={selectingIds}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      )}
    </Stack>
  );
}

export function ExploreFileTable({
  fileIds,
  selectedIds,
  setSelectedIds,
}: {
  fileIds: string[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const {
    data: files,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cfdb-files-by-id", fileIds],
    queryFn: () => fetchCfdbSelectedFiles(fileIds),
  });

  // Same rule as Browse: only formats CVH can visualize are selectable.
  const selectableIds = useMemo(
    () =>
      new Set((files ?? []).filter(isCfdbFileSupported).map((f) => f.localId)),
    [files],
  );

  const handleToggle = useCallback(
    (id: string) => {
      if (!selectableIds.has(id)) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [selectableIds, setSelectedIds],
  );

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === selectableIds.size ? new Set() : new Set(selectableIds),
    );
  }, [selectableIds, setSelectedIds]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const handleToggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (isError) {
    return (
      <Stack direction="row" spacing={2} alignItems="center" py={2}>
        <Typography variant="body2">Couldn’t load these files.</Typography>
        <Button variant="outlined" onClick={() => refetch()}>
          Try Again
        </Button>
      </Stack>
    );
  }
  if (isLoading || !files) return <Loading />;

  return (
    <TableContainer sx={{ maxHeight: 640, overflow: "auto" }}>
      <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
        <FileTableHead
          selectableCount={selectableIds.size}
          selectedCount={selectedIds.size}
          onToggleAll={handleToggleAll}
        />
        <TableBody>
          {files.map((file, index) => (
            <DatasetRow
              key={file.localId}
              file={file}
              selected={selectedIds.has(file.localId)}
              disabled={!selectableIds.has(file.localId)}
              expanded={expandedIds.has(file.localId)}
              onToggle={handleToggle}
              onToggleExpanded={handleToggleExpanded}
              // At most 100 rows, so no virtualizer to measure for.
              measureRef={noop}
              dataIndex={index}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
