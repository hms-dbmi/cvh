import Editor from "@monaco-editor/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CheckCircle, Code } from "@phosphor-icons/react";
import { upgradeAndParse } from "@vitessce/schemas";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vitessce } from "vitessce";
import "react-grid-layout/css/styles.css";
import { useSnackbarActions } from "@/components/Snackbar/useSnackbarStore";
import {
  useGetVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations";
import { BottomBar, type Mode } from "./BottomBar.tsx";

interface VitessceViewerProps {
  permissions: number;
  selectedVizId?: string;
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

function VitessceViewer({ permissions, selectedVizId }: VitessceViewerProps) {
  const [mode, setMode] = useState<Mode>("exploring");
  const [editorValue, setEditorValue] = useState("");

  // @ts-expect-error TODO: Remove ignore.
  const { data } = useGetVisualization(selectedVizId);

  const { mutate: updateViz } = useUpdateVisualization();
  const { toastError } = useSnackbarActions();

  const hasWritePermissions = permissions >= 2;

  useEffect(() => {
    if (data?.conf) {
      setEditorValue(JSON.stringify(data.conf, null, 2));
    } else {
      setEditorValue("");
    }
  }, [data?.conf]);

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

  const publishViz = useCallback(() => {
    try {
      if (!selectedVizId || !hasWritePermissions) {
        return;
      }
      updateViz({
        body: { published: true },
        params: {
          path: { visualization_uuid: selectedVizId },
        },
      });
    } catch (e) {
      toastError("Error updating visualization publish status");
      console.error(e);
    }
  }, [updateViz, toastError, selectedVizId, hasWritePermissions]);

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
            visualizationID={selectedVizId}
            onPublish={hasWritePermissions ? publishViz : undefined}
            hasWritePermissions={hasWritePermissions}
          />
        </Box>
      )}
    </Box>
  );
}

export default memo(VitessceViewer);
