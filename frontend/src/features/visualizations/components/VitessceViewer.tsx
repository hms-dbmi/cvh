import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import Editor from "@monaco-editor/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Code } from "@phosphor-icons/react";
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "react-grid-layout/css/styles.css";
import { useSnackbarActions } from "@/components/Snackbar/useSnackbarStore";
import {
  useGetVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations";
import { BottomBar, type Mode } from "./BottomBar.tsx";

// The `vitessce` package + its transitives (three.js, higlass, neuroglancer,
// zarr, …) parse to multiple MB of JS. Loading them at module scope would
// freeze the main thread while V8 parses/executes on every entry into this
// viewer. We defer them three ways:
//
//   * `Vitessce` component → React.lazy so the runtime chunk downloads
//     and parses only when we're about to render the canvas, not while
//     the code editor is on screen.
//   * `generateConfig` → dynamic import inside the drop-generate handler.
//   * `@vitessce/schemas` `upgradeAndParse` → dynamic import inside the
//     editor-save validator.
const Vitessce = lazy(() =>
  import("vitessce").then((m) => ({ default: m.Vitessce })),
);

const DROP_ZONE_ID = "vitessce-drop-zone";

type VitessceDragPayload = {
  tool: "vitessce";
  url: string;
  name: string;
  id: string;
};

function isVitessceDragPayload(data: unknown): data is VitessceDragPayload {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { tool?: unknown }).tool === "vitessce" &&
    typeof (data as { url?: unknown }).url === "string"
  );
}

interface VitessceViewerProps {
  permissions: number;
  selectedVizId?: string;
}

function CodeEditor({
  editorValue,
  setEditorValue,
  onPasteFlush,
  readOnly,
}: {
  editorValue: string;
  setEditorValue: (value: string) => void;
  onPasteFlush?: (value: string) => void;
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
          onMount={(editor) => {
            // Paste is a discrete "committed" action — don't make the
            // user wait out the debounce. Read the value straight off
            // the editor because React state hasn't caught up yet.
            editor.onDidPaste(() => {
              onPasteFlush?.(editor.getValue());
            });
          }}
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
  // Held while a dropped dataset is waiting on user confirmation to
  // overwrite the current config. Cleared after apply or cancel.
  const [pendingDrop, setPendingDrop] = useState<VitessceDragPayload | null>(
    null,
  );

  // @ts-expect-error TODO: Remove ignore.
  const { data } = useGetVisualization(selectedVizId);

  const { mutate: updateViz } = useUpdateVisualization();
  const { toastError, toastSuccess } = useSnackbarActions();

  const hasWritePermissions = permissions >= 2;

  const hasExistingConfig =
    !!data?.conf && Object.keys(data.conf as object).length > 0;

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: DROP_ZONE_ID,
    disabled: !hasWritePermissions || !selectedVizId,
  });

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

  // Editor timer lives on a ref so `saveEditorValue` (which paste can
  // call directly) can cancel a pending debounced save before firing
  // immediately.
  const editorSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const saveEditorValue = useCallback(
    async (value: string) => {
      if (!selectedVizId || !hasWritePermissions) return;
      if (editorSaveTimeoutRef.current) {
        clearTimeout(editorSaveTimeoutRef.current);
        editorSaveTimeoutRef.current = null;
      }
      let parsed: object;
      try {
        parsed = JSON.parse(value);
      } catch {
        toastError("Invalid JSON — changes not saved.");
        return;
      }
      if (data?.tool === "vitessce") {
        try {
          // Dynamic import so the `@vitessce/schemas` bundle only downloads
          // on save (typically after the code editor is already visible),
          // not at module load. See the top-of-file note on the lazy split.
          const { upgradeAndParse } = await import("@vitessce/schemas");
          upgradeAndParse(parsed);
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "Unknown validation error";
          toastError(`Invalid Vitessce config: ${message} — changes not saved.`);
          return;
        }
      }
      // Optimistically mark this value as committed so the debounced
      // effect that re-fires from setEditorValue after paste doesn't
      // schedule a redundant save with the same content.
      lastServerValueRef.current = value;
      updateViz({
        params: { path: { visualization_uuid: selectedVizId } },
        body: { conf: parsed as Record<string, never> },
      });
    },
    [selectedVizId, hasWritePermissions, data?.tool, updateViz, toastError],
  );

  // Generate a fresh Vitessce config from a single dataset URL and
  // save it. Called both directly (empty-config path) and after the
  // user confirms overwriting an existing config.
  const applyGeneratedConfig = useCallback(
    async (payload: VitessceDragPayload) => {
      if (!selectedVizId || !hasWritePermissions) return;
      try {
        // Dynamic import — this is invoked from a drag-drop, so the
        // vitessce chunk can safely download at gesture time rather than
        // at module load. See the top-of-file note on the lazy split.
        const { generateConfig } = await import("vitessce");
        const generated = await generateConfig([payload.url]);
        updateViz({
          params: { path: { visualization_uuid: selectedVizId } },
          body: { conf: generated as Record<string, never> },
        });
        toastSuccess(`Generated Vitessce config from "${payload.name}".`);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Unknown error";
        toastError(`Could not generate config: ${message}`);
        console.error(e);
      }
    },
    [
      selectedVizId,
      hasWritePermissions,
      updateViz,
      toastSuccess,
      toastError,
    ],
  );

  // Observe drops on the parent DndContext (installed by VitessceVizShell).
  // We only react when the drop landed on our droppable and the payload
  // is a vitessce dataset; anything else is either irrelevant or a stray
  // Gosling drag that shouldn't reach us.
  useDndMonitor({
    onDragEnd: (event) => {
      if (event.over?.id !== DROP_ZONE_ID) return;
      if (!isVitessceDragPayload(event.active.data.current)) return;
      if (!hasWritePermissions) return;
      const payload = event.active.data.current;
      if (hasExistingConfig) {
        // Preserve existing config until the user confirms overwrite.
        setPendingDrop(payload);
      } else {
        void applyGeneratedConfig(payload);
      }
    },
  });

  // Auto-save the editor after typing settles.
  useEffect(() => {
    if (!selectedVizId || !hasWritePermissions) return;
    if (editorValue === lastServerValueRef.current) return;
    if (editorValue === "") return;

    // Shorter than the exploring-mode viewer's debounce — typing is a
    // continuous stream where a 5s pause feels laggy; 2.5s catches
    // natural "done typing" pauses without spamming mid-edit toasts.
    const DEBOUNCE_MS = 2500;
    editorSaveTimeoutRef.current = setTimeout(() => {
      editorSaveTimeoutRef.current = null;
      saveEditorValue(editorValue);
    }, DEBOUNCE_MS);

    return () => {
      if (editorSaveTimeoutRef.current) {
        clearTimeout(editorSaveTimeoutRef.current);
        editorSaveTimeoutRef.current = null;
      }
    };
  }, [editorValue, selectedVizId, hasWritePermissions, saveEditorValue]);

  return (
    <Box sx={{ height: "100%", position: "relative" }}>
      <Paper
        ref={setDropRef}
        sx={{
          flex: 1,
          minWidth: 0,
          m: 2,
          height: "calc(100% - 125px)",
          overflow: "hidden",
          // Highlight the panel edge while a compatible dataset hovers over
          // it. `isOver` only becomes true for drops @dnd-kit considers
          // targeted at this droppable, so we don't need to inspect the
          // payload here.
          outline: isOver ? "2px solid" : "2px solid transparent",
          outlineColor: isOver ? "primary.main" : "transparent",
          transition: "outline-color 120ms ease",
        }}
      >
        {mode === "exploring" && !vitessceConfig && selectedVizId && (
          <Stack
            sx={{
              // 100% of Paper minus the 16px margins on each axis so the
              // dashed border stays inside the Paper's overflow:hidden
              // clip (otherwise the bottom + right borders get cut off).
              height: "calc(100% - 32px)",
              width: "calc(100% - 32px)",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
              textAlign: "center",
              color: "text.secondary",
              // Match the panel's drag-over highlight with a dashed border
              // so the placeholder reads as a drop zone at rest, not just
              // empty space.
              border: "2px dashed",
              borderColor: isOver ? "primary.main" : "#CAD5DA",
              borderRadius: 2,
              m: 2,
              transition: "border-color 120ms ease",
            }}
            spacing={1}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              No configuration yet
            </Typography>
            <Typography variant="body2">
              {hasWritePermissions
                ? "Drag a Vitessce-compatible dataset from the sidebar to generate a default configuration, or paste a config into the code editor."
                : "This visualization has no configuration yet."}
            </Typography>
          </Stack>
        )}
        {mode === "exploring" && vitessceConfig && (
          <Suspense
            fallback={
              <Stack
                sx={{
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Loading viewer…
                </Typography>
              </Stack>
            }
          >
            <Vitessce
              config={vitessceConfig}
              height={900}
              theme="light"
              onConfigChange={hasWritePermissions ? saveViz : undefined}
            />
          </Suspense>
        )}
        {mode === "editing" && selectedVizId && (
          <CodeEditor
            editorValue={editorValue}
            setEditorValue={setEditorValue}
            onPasteFlush={hasWritePermissions ? saveEditorValue : undefined}
            readOnly={!hasWritePermissions}
          />
        )}
      </Paper>
      <Dialog open={pendingDrop !== null} onClose={() => setPendingDrop(null)}>
        <DialogTitle>Replace current configuration?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Dropping <strong>{pendingDrop?.name}</strong> will overwrite the
            visualization's current configuration with a freshly generated one.
            This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDrop(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (pendingDrop) {
                void applyGeneratedConfig(pendingDrop);
              }
              setPendingDrop(null);
            }}
          >
            Replace
          </Button>
        </DialogActions>
      </Dialog>
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
