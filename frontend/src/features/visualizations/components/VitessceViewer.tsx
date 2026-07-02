import Editor from "@monaco-editor/react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Code } from "@phosphor-icons/react";
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
  readOnly,
}: {
  editorValue: string;
  setEditorValue: (value: string) => void;
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

  // Track the last string that came from the server so the auto-save
  // effect below can skip when the editor's value is just what we loaded.
  const lastServerValueRef = useRef<string>("");

  useEffect(() => {
    const serverVal = data?.conf ? JSON.stringify(data.conf, null, 2) : "";
    lastServerValueRef.current = serverVal;
    setEditorValue(serverVal);
  }, [data?.conf]);

  // Vitessce uses `config.uid` to detect that a config has changed. Without
  // it, switching between visualizations in the workspace keeps the prior
  // viewer state. Stamp the visualization's UUID onto the config so each
  // viz produces a distinct identity.
  const vitessceConfig = useMemo(() => {
    if (!data?.conf || !selectedVizId) return null;
    return { ...(data.conf as object), uid: selectedVizId };
  }, [data?.conf, selectedVizId]);

  // Auto-save for Vitessce viewer (exploring mode)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveViz = useMemo(() => {
    const DEBOUNCE_MS = 5000;
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

  // Auto-save the editor after typing settles. Invalid JSON / invalid
  // Vitessce config surfaces as a toast so the user knows their edit
  // wasn't persisted.
  useEffect(() => {
    if (!selectedVizId || !hasWritePermissions) return;
    if (editorValue === lastServerValueRef.current) return;
    if (editorValue === "") return;

    // Shorter than the exploring-mode viewer's debounce — typing is a
    // continuous stream where a 5s pause feels laggy; 2.5s catches
    // natural "done typing" pauses without spamming mid-edit toasts.
    const DEBOUNCE_MS = 2500;
    const t = setTimeout(() => {
      let parsed: object;
      try {
        parsed = JSON.parse(editorValue);
      } catch {
        toastError("Invalid JSON — changes not saved.");
        return;
      }
      if (data?.tool === "vitessce") {
        try {
          upgradeAndParse(parsed);
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "Unknown validation error";
          toastError(`Invalid Vitessce config: ${message} — changes not saved.`);
          return;
        }
      }
      updateViz({
        params: { path: { visualization_uuid: selectedVizId } },
        body: { conf: parsed as Record<string, never> },
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [
    editorValue,
    selectedVizId,
    hasWritePermissions,
    updateViz,
    toastError,
    data?.tool,
  ]);

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
        {mode === "exploring" && vitessceConfig && (
          <Vitessce
            config={vitessceConfig}
            height={900}
            theme="light"
            onConfigChange={hasWritePermissions ? saveViz : undefined}
          />
        )}
        {mode === "editing" && selectedVizId && (
          <CodeEditor
            editorValue={editorValue}
            setEditorValue={setEditorValue}
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
