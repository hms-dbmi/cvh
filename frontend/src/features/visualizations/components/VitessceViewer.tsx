import Editor from "@monaco-editor/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import {
  CheckCircle,
  Code,
  GlobeSimple,
  PresentationChart,
} from "@phosphor-icons/react";
import { upgradeAndParse } from "@vitessce/schemas";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vitessce } from "vitessce";
import "react-grid-layout/css/styles.css";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";
import {
  useGetProjectVisualizations,
  useGetVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations";
import DataList from "./DataList.tsx";
import VisualizationsList from "./VisualizationsList.tsx";

type Mode = "editing" | "exploring";

interface VitessceViewerProps {
  projectId: string;
  permissions: number;
}

export function BottomBar({
  mode,
  onModeChange,
  published,
  onTogglePublish,
  hasWritePermissions,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  published?: boolean;
  onTogglePublish?: () => void;
  hasWritePermissions?: boolean;
}) {
  const editorMode = hasWritePermissions ? "editing" : "configuration";
  const isEditorActive = mode === "editing";

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 1.5,
        borderRadius: 2,
        border: "1px solid #CAD5DA",
        boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.15)",
        height: 64,
      }}
    >
      <Stack direction="row" spacing={1}>
        <Button
          onClick={() => onModeChange("editing")}
          startIcon={<Code size={24} />}
          sx={{
            bgcolor: isEditorActive ? "black" : "white",
            color: isEditorActive ? "white" : "black",
            border:
              isEditorActive ? "1px solid black" : "1px solid #C8CCCE",
            borderRadius: 2,
            px: 1.5,
            py: 1,
            textTransform: "none",
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: "0.28px",
            "&:hover": {
              bgcolor: isEditorActive ? "#333" : "#f5f5f5",
            },
          }}
        >
          {editorMode === "editing" ? "Editing" : "Configuration"}
        </Button>
        <Button
          onClick={() => onModeChange("exploring")}
          startIcon={<PresentationChart size={24} />}
          sx={{
            bgcolor: mode === "exploring" ? "black" : "white",
            color: mode === "exploring" ? "white" : "black",
            border:
              mode === "exploring" ? "1px solid black" : "1px solid #C8CCCE",
            borderRadius: 2,
            px: 1.5,
            py: 1,
            textTransform: "none",
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: "0.28px",
            "&:hover": {
              bgcolor: mode === "exploring" ? "#333" : "#f5f5f5",
            },
          }}
        >
          Exploring
        </Button>
      </Stack>
      {onTogglePublish && (
        <>
          <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
          <Button
            onClick={onTogglePublish}
            startIcon={<GlobeSimple size={24} />}
            sx={{
              bgcolor: published ? "#27AE60" : "transparent",
              color: published ? "white" : "#4E5A63",
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "0.28px",
              px: 1.5,
              py: 1,
              borderRadius: 2,
              "&:hover": {
                bgcolor: published ? "#27AE60" : "rgba(0,0,0,0.04)",
              },
            }}
          >
            {published ? "Published" : "Make Public"}
          </Button>
        </>
      )}
    </Paper>
  );
}

function CodeEditor({
  editorValue,
  setEditorValue,
  onApply,
  readOnly,
}: {
  editorValue: string;
  setEditorValue: (value: string) => void;
  onApply: () => void;
  readOnly?: boolean;
}) {
  return (
    <Stack sx={{ height: "100%", p: 2 }} spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Code size={20} />
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, letterSpacing: "0.5px" }}
        >
          {readOnly ? "CONFIGURATION" : "CODE EDITOR"}
        </Typography>
        {!readOnly && (
          <Button
            startIcon={<CheckCircle size={20} weight="fill" color="#1976d2" />}
            onClick={onApply}
            sx={{ textTransform: "none", ml: 1 }}
          >
            Apply Changes
          </Button>
        )}
      </Stack>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          border: "1px solid #E0E0E0",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Editor
          height="100%"
          language="json"
          value={editorValue}
          onChange={(value) => setEditorValue(value ?? "")}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            padding: { top: 12, bottom: 12 },
            readOnly,
            contextmenu: false,
          }}
        />
      </Box>
    </Stack>
  );
}

function VitessceViewer({ projectId, permissions }: VitessceViewerProps) {
  const [selectedVizId, setSelectedVizId] = useState<string | undefined>(
    undefined,
  );
  const [mode, setMode] = useState<Mode>("exploring");
  const [editorValue, setEditorValue] = useState("");

  const { data: visualizations } = useGetProjectVisualizations({
    projectId,
    tags: [],
  });

  // Auto-select first vitessce visualization on initial load
  useEffect(() => {
    if (!selectedVizId && visualizations?.length) {
      const firstVitessce = visualizations.find((v) => v.tool === "vitessce");
      if (firstVitessce?.uuid) {
        setSelectedVizId(firstVitessce.uuid);
      }
    }
  }, [selectedVizId, visualizations]);

  // @ts-expect-error TODO: Remove ignore.
  const { data } = useGetVisualization(selectedVizId);

  const { mutate: updateViz } = useUpdateVisualization();
  const { toastError } = useSnackbarActions();

  const hasWritePermissions = permissions >= 2;

  // Reset editor value when a different visualization is selected or its data changes
  useEffect(() => {
    if (data?.conf) {
      setEditorValue(JSON.stringify(data.conf, null, 2));
    } else {
      setEditorValue("");
    }
  }, [selectedVizId, data?.conf]);

  // Auto-save for Vitessce viewer (exploring mode)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveViz = useMemo(() => {
    const DEBOUNCE_MS = 500;
    return (config: object) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        try {
          if (!selectedVizId || !hasWritePermissions) {
            return;
          }
          updateViz({
            body: { conf: config as Record<string, never> },
            params: {
              path: { visualization_uuid: selectedVizId },
            },
          });
        } catch (e) {
          toastError("Error saving visualization");
          console.error(e);
        }
      }, DEBOUNCE_MS);
    };
  }, [updateViz, toastError, selectedVizId, hasWritePermissions]);

  const togglePublishViz = useCallback(() => {
    try {
      if (!selectedVizId || !hasWritePermissions) {
        return;
      }
      updateViz({
        body: { published: !data?.published },
        params: {
          path: { visualization_uuid: selectedVizId },
        },
      });
    } catch (e) {
      toastError("Error updating visualization publish status");
      console.error(e);
    }
  }, [updateViz, toastError, selectedVizId, hasWritePermissions, data?.published]);

  // Manual save for editor mode
  const handleEditorSave = useCallback(() => {
    if (!selectedVizId) return;

    let parsed: object;
    try {
      parsed = JSON.parse(editorValue);
    } catch {
      toastError("Invalid JSON. Please fix syntax errors before saving.");
      return;
    }

    if (data?.tool === "vitessce") {
      try {
        upgradeAndParse(parsed);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Unknown validation error";
        toastError(`Invalid Vitessce config: ${message}`);
        return;
      }
    }

    updateViz({
      params: { path: { visualization_uuid: selectedVizId } },
      body: { conf: parsed as Record<string, never> },
    });
  }, [editorValue, updateViz, selectedVizId, toastError, data?.tool]);

  return (
    <Box sx={{ height: "100%", position: "relative" }}>
      <Stack direction="row" sx={{ height: "100%" }}>
        <Box sx={{ width: 400, flexShrink: 0, overflowY: "auto", p: 2 }}>
          <VisualizationsList
            projectId={projectId}
            setSelectedVizId={setSelectedVizId}
            selectedVizId={selectedVizId}
            permissions={permissions}
            disabledTools={["gosling"]}
          />
          <DataList showVitessceWarning={!!selectedVizId} showActions />
        </Box>
        <Paper
          sx={{
            flex: 1,
            minWidth: 0,
            m: 2,
            height: "calc(100% - 125px)",
            overflow: "hidden",
          }}
        >
          {mode === "exploring" && data?.conf && (
            <Vitessce
              config={data.conf}
              height={900}
              theme="light"
              onConfigChange={hasWritePermissions ? saveViz : undefined}
            />
          )}
          {mode === "editing" && selectedVizId && (
            <CodeEditor
              editorValue={editorValue}
              setEditorValue={setEditorValue}
              onApply={handleEditorSave}
              readOnly={!hasWritePermissions}
            />
          )}
        </Paper>
      </Stack>
      {selectedVizId && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
        >
          <BottomBar
            mode={mode}
            onModeChange={setMode}
            published={data?.published}
            onTogglePublish={hasWritePermissions ? togglePublishViz : undefined}
            hasWritePermissions={hasWritePermissions}
          />
        </Box>
      )}
    </Box>
  );
}

export default VitessceViewer;
