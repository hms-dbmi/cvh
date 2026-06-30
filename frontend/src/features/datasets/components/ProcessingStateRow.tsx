import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  CaretRight,
  CheckCircle,
  Clock,
  WarningCircle,
} from "@phosphor-icons/react";
import { formatRelative } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useCfdbJob } from "@/api/cfdb";
import { useUpdateProcessingStatus } from "../api/useDatasets";
import type { ProcessingStatus } from "../formatEligibility";
import StartProcessingDialog from "./StartProcessingDialog";

interface ProcessingStateRowProps {
  datasetUuid: string;
  status: ProcessingStatus;
  jobId: string | null | undefined;
  startedAt: string | null | undefined;
  completedAt: string | null | undefined;
  errorMessage: string | null | undefined;
  hasWritePermissions: boolean;
}

/**
 * State-conditional row injected into the dataset tile sidebar. Renders
 * different affordances per processing_status. Owns the polling lifecycle:
 * when status === "started" and a jobId is set, it polls cfdb directly and
 * persists the terminal outcome back to CVH via useUpdateProcessingStatus.
 *
 * Returns null for `not_needed` so the tile renders identically to today
 * for non-cfdb datasets.
 */
function ProcessingStateRow({
  datasetUuid,
  status,
  jobId,
  startedAt,
  completedAt,
  errorMessage,
  hasWritePermissions,
}: ProcessingStateRowProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Poll cfdb directly when a job is in flight. The hook auto-stops on
  // terminal states; we mirror the result back to CVH below.
  const { data: job } = useCfdbJob(jobId, { enabled: status === "started" });
  const { mutate: persist } = useUpdateProcessingStatus();

  // Whenever polling lands on a terminal state, persist it once.
  const settled = job?.status === "completed" || job?.status === "failed";
  const [reported, setReported] = useState(false);
  useEffect(() => {
    if (!settled || reported) return;
    persist({
      params: { path: { dataset_uuid: datasetUuid } },
      body: {
        status: job?.status === "completed" ? "processed" : "failed",
        error: job?.error ?? null,
      },
    });
    setReported(true);
  }, [settled, reported, persist, datasetUuid, job?.status, job?.error]);

  const startedLabel = useMemo(
    () => (startedAt ? formatRelative(new Date(startedAt), new Date()) : null),
    [startedAt],
  );
  const completedLabel = useMemo(
    () =>
      completedAt ? formatRelative(new Date(completedAt), new Date()) : null,
    [completedAt],
  );

  if (status === "not_needed") return null;

  if (status === "needed") {
    return (
      <>
        <Box
          component={hasWritePermissions ? "button" : "div"}
          onClick={hasWritePermissions ? () => setModalOpen(true) : undefined}
          aria-label={hasWritePermissions ? "Start data processing" : undefined}
          sx={{
            border: "1px solid #E2B447",
            backgroundColor: "#FFF9E6",
            borderRadius: "8px",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            cursor: hasWritePermissions ? "pointer" : "default",
            opacity: hasWritePermissions ? 1 : 0.6,
            font: "inherit",
            textAlign: "left",
          }}
        >
          <Typography variant="body2" sx={{ color: "#7A5A00" }}>
            Processing Needed
          </Typography>
          {hasWritePermissions && (
            <CaretRight size={16} color="#7A5A00" weight="bold" />
          )}
        </Box>
        <StartProcessingDialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          datasetUuid={datasetUuid}
          hasWritePermissions={hasWritePermissions}
        />
      </>
    );
  }

  if (status === "started") {
    return (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{
          border: "1px solid #E2E9EC",
          backgroundColor: "#F5F7FA",
          borderRadius: "8px",
          padding: "8px 12px",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Clock size={16} color="#4E5A63" />
          <Typography variant="body2" sx={{ color: "#4E5A63" }}>
            Processing Started
          </Typography>
        </Stack>
        {startedLabel && (
          <Typography variant="caption" sx={{ color: "#4E5A63" }}>
            {startedLabel}
          </Typography>
        )}
      </Stack>
    );
  }

  if (status === "processed") {
    return (
      <Chip
        size="small"
        icon={<CheckCircle size={16} color="#27AE60" weight="fill" />}
        label={completedLabel ? `Processed ${completedLabel}` : "Processed"}
        sx={{
          backgroundColor: "#DEF8E9",
          color: "#1B7A40",
          alignSelf: "flex-start",
          "& .MuiChip-icon": { color: "#27AE60" },
        }}
      />
    );
  }

  // status === "failed"
  return (
    <Tooltip title={errorMessage ?? "Processing failed"}>
      <Box
        component={hasWritePermissions ? "button" : "div"}
        onClick={hasWritePermissions ? () => setModalOpen(true) : undefined}
        aria-label={hasWritePermissions ? "Retry data processing" : undefined}
        sx={{
          border: "1px solid #D32F2F",
          backgroundColor: "#FDECEC",
          borderRadius: "8px",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          cursor: hasWritePermissions ? "pointer" : "default",
          font: "inherit",
          textAlign: "left",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <WarningCircle size={16} color="#D32F2F" />
          <Typography variant="body2" sx={{ color: "#D32F2F" }}>
            Processing Failed
          </Typography>
        </Stack>
        {hasWritePermissions && (
          <Typography variant="caption" sx={{ color: "#D32F2F" }}>
            Retry
          </Typography>
        )}
        <StartProcessingDialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          datasetUuid={datasetUuid}
          hasWritePermissions={hasWritePermissions}
        />
      </Box>
    </Tooltip>
  );
}

export default ProcessingStateRow;
