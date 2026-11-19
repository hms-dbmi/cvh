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
  fetchCfdbFilesByLocalIds,
  getDccShortName,
  isCfdbFileSupported,
} from "@/api/cfdb";
import {
  useGetYacAccess,
  useYacSignIn,
  useYacToken,
  useYacUsage,
  YacSignInRequired,
} from "@/features/profile/api/useYacAccess";
import {
  NEAR_LIMIT_PERCENT,
  UsageUnavailable,
  useAiUsageContent,
} from "@/features/profile/components/AiUsage";
import plural from "@/utils/plural";
import type { DccType } from "../../../../cfdb-types";
import { DatasetRow, FileTableHead, MAX_ADD_FILES } from "./CfdbFileTable";

const ExploreChat = lazy(() => import("./ExploreChat"));

const noop = () => {};

// The bottom bar while finding files: how many the filters leave, and whether
// that's few enough to pick from. Nothing to say until a filter reaches Files.
export function exploreSummary(fileIds: string[] | null) {
  if (fileIds === null) return { label: null, canContinue: false };
  const matched = fileIds.length;
  return {
    label:
      matched > MAX_ADD_FILES
        ? `${plural(matched, "File")} Matched · Filter to ${MAX_ADD_FILES} or fewer to select files`
        : `${plural(matched, "File")} Matched`,
    canContinue: matched > 0 && matched <= MAX_ADD_FILES,
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
  onConversationChange,
  selectedIds,
  setSelectedIds,
}: {
  dcc: DccType;
  selectingIds: string[] | null;
  onFileIdsChange: (fileIds: string[] | null) => void;
  onConversationChange: (hasConversation: boolean) => void;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const { data: access } = useGetYacAccess();
  const approved = access?.status === "approved";
  const { data: usage, error: usageError } = useYacUsage(approved);
  const { data: token, error: tokenError } = useYacToken(approved);
  const signIn = useYacSignIn();
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
    // useFlexGap: the hidden chat box mustn't leave a gap above the table.
    <Stack spacing={2} useFlexGap sx={{ flex: 1, minHeight: 0 }}>
      {showBanner && aiContent?.body}
      {/* The usage banner covers a sign-in problem when usage fails too. A
          failed refresh with a token still in hand stays quiet unless it
          needs a sign-in; the next refresh usually succeeds. */}
      {approved &&
        tokenError &&
        !usageError &&
        (!token || tokenError instanceof YacSignInRequired) && (
          <UsageUnavailable
            error={tokenError}
            signIn={signIn}
            signInTo="use Explore"
            unavailable="Explore is unavailable right now."
          />
        )}
      {approved && !token && !usageError && !tokenError && <Loading />}
      {approved && token && (
        // Hidden rather than unmounted while selecting files, so going back
        // keeps the conversation and charts.
        <Box
          sx={{
            display: selectingIds === null ? "block" : "none",
            // UDIChat fills its parent, so the parent needs a set height:
            // the space left in the dialog, never less than 420px.
            flex: 1,
            minHeight: 420,
          }}
        >
          <Suspense fallback={<Loading />}>
            <ExploreChat
              token={token}
              dcc={getDccShortName(dcc)}
              onFileIdsChange={onFileIdsChange}
              onConversationChange={onConversationChange}
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
    queryFn: () => fetchCfdbFilesByLocalIds(fileIds),
    // A fixed list: never refetch behind the user's back mid-selection.
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Only the files asked for, once each: the lookup isn't scoped to one
  // library, so another library's file with the same ID can come back.
  const listed = useMemo(() => {
    const requested = new Set(fileIds);
    const byId = new Map(
      (files ?? [])
        .filter((file) => requested.has(file.localId))
        .map((file) => [file.localId, file]),
    );
    return Array.from(byId.values());
  }, [files, fileIds]);

  // Same rule as Browse: only formats CVH can visualize are selectable.
  const selectableIds = useMemo(
    () => new Set(listed.filter(isCfdbFileSupported).map((f) => f.localId)),
    [listed],
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

  if (isError && !files) {
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

  // YAC's copy of cfdb can be ahead of or behind cfdb itself.
  const missing = new Set(fileIds).size - listed.length;

  return (
    // Fills the space left in the dialog; the table scrolls inside it.
    <Stack spacing={1} sx={{ flex: 1, minHeight: 0 }}>
      {missing > 0 && (
        <Typography variant="body2">
          {missing === fileIds.length
            ? "None of these files are in the library right now."
            : `${plural(missing, "file")} matched in Explore ${missing === 1 ? "isn’t" : "aren’t"} in the library right now.`}
        </Typography>
      )}
      {/* Never shorter than a few rows; very short windows scroll instead. */}
      <TableContainer sx={{ flex: 1, minHeight: 240, overflow: "auto" }}>
        <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
          <FileTableHead
            selectableCount={selectableIds.size}
            selectedCount={selectedIds.size}
            onToggleAll={handleToggleAll}
          />
          <TableBody>
            {listed.map((file, index) => (
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
    </Stack>
  );
}
