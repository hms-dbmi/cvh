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
import posthog from "@/posthog";
import {
  useGetVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations";
import {
  type AnnotationUtils,
  fillColumns,
  hasAnnotationPanel,
  setAnnotationCloseButton,
  toAnnotatingConfig,
} from "../utils/annotatingConfig.ts";
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
//   * Annotation helpers (`addAnnotationControllerView`, …) → dynamic import
//     on the switch into Annotating mode and on save.
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
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
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

function VitessceViewer({
  permissions,
  selectedVizId,
  isSidebarOpen,
  onToggleSidebar,
}: VitessceViewerProps) {
  const [mode, setMode] = useState<Mode>("exploring");
  // Loaded on the first switch into Annotating mode; see toAnnotatingConfig.
  const [annotationUtils, setAnnotationUtils] =
    useState<AnnotationUtils | null>(null);
  // The viewer's config at the last mode switch, so unsaved changes carry
  // between Exploring and Annotating. Null means use the server config.
  const [modeBaseConfig, setModeBaseConfig] = useState<object | null>(null);
  // Vitessce only re-reads `config` when `config.uid` changes, so each mode
  // switch bumps this to remount the viewer with the new config.
  const [modeRevision, setModeRevision] = useState(0);
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
    // Server payload just landed — the live config ref and dirty flag
    // are stale from whatever the user was doing on the previous viz.
    latestConfigRef.current = null;
    setHasUnsavedChanges(false);
    setModeBaseConfig(null);
  }, [data?.conf]);

  // Vitessce uses `config.uid` to detect that a config has changed. Without
  // it, switching between visualizations in the workspace keeps the prior
  // viewer state. Stamp the visualization's UUID onto the config so each
  // viz produces a distinct identity.
  const vitessceConfig = useMemo(() => {
    const base = modeBaseConfig ?? (data?.conf as object | undefined);
    if (!base || !selectedVizId) return null;
    const config =
      mode === "annotating" && annotationUtils
        ? toAnnotatingConfig(base, annotationUtils)
        : setAnnotationCloseButton(base, true);
    return { ...config, uid: `${selectedVizId}-${modeRevision}` };
  }, [
    data?.conf,
    selectedVizId,
    mode,
    modeBaseConfig,
    modeRevision,
    annotationUtils,
  ]);

  const handleModeChange = useCallback(
    async (next: Mode) => {
      if (next === "annotating" && !annotationUtils) {
        try {
          setAnnotationUtils(await import("vitessce"));
        } catch (e) {
          toastError("Could not load annotation tools.");
          console.error(e);
          return;
        }
      }
      setModeBaseConfig(latestConfigRef.current);
      setModeRevision((revision) => revision + 1);
      setMode(next);
    },
    [annotationUtils, toastError],
  );

  // Exploring-mode changes (config edits from Vitessce's own UI:
  // brushes, view toggles, etc.) are held in a ref and only persisted
  // when the user clicks Save in the BottomBar — no more debounced
  // autosave. `hasUnsavedChanges` drives the Save button's enabled
  // state.
  const latestConfigRef = useRef<object | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const shownWithAnnotationPanel = useMemo(
    () => !!vitessceConfig && hasAnnotationPanel(vitessceConfig),
    [vitessceConfig],
  );

  const handleConfigChange = useCallback(
    (config: object) => {
      // The user closed the annotation panel (possible in Exploring mode).
      // Vitessce leaves its columns empty, so reload the viewer with the
      // remaining views stretched back across the full width.
      if (shownWithAnnotationPanel && !hasAnnotationPanel(config)) {
        const filled = fillColumns(config);
        latestConfigRef.current = filled;
        setModeBaseConfig(filled);
        setModeRevision((revision) => revision + 1);
      } else {
        latestConfigRef.current = config;
      }
      setHasUnsavedChanges(true);
    },
    [shownWithAnnotationPanel],
  );

  const saveViz = useCallback(async () => {
    if (!selectedVizId || !hasWritePermissions) return;
    const latest = latestConfigRef.current;
    if (!latest) return;
    try {
      // Annotation editing is a viewer mode, not part of the visualization:
      // save it switched off, with the panel's close button shown, so
      // collaborators and public viewers get read-only annotations they
      // can dismiss.
      const { hasAnnotationControllerView, disableAnnotationEditing } =
        await import("vitessce");
      const config = hasAnnotationControllerView(latest)
        ? setAnnotationCloseButton(disableAnnotationEditing(latest), true)
        : latest;
      posthog.capture("visualization_saved", { viewer: "vitessce" });
      updateViz({
        body: { conf: config as Record<string, never> },
        params: { path: { visualization_uuid: selectedVizId } },
      });
      setHasUnsavedChanges(false);
    } catch (e) {
      toastError("Error saving visualization");
      console.error(e);
    }
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
        {mode !== "editing" && !vitessceConfig && selectedVizId && (
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
        {mode !== "editing" && vitessceConfig && (
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
              onConfigChange={hasWritePermissions ? handleConfigChange : undefined}
              areAnnotationsEditable={mode === "annotating"}
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
            // `left: 50%` caps the shrink-to-fit width at half the panel,
            // which would wrap the bar's labels.
            width: "max-content",
            zIndex: 10,
          }}
        >
          <BottomBar
            mode={mode}
            onModeChange={handleModeChange}
            published={data?.published}
            visualizationID={selectedVizId}
            onPublish={hasWritePermissions ? publishViz : undefined}
            // Save is only meaningful outside editing mode — the code editor
            // path autosaves on a 2.5s debounce, so a Save button there
            // would fire redundantly. Hide it when editing.
            onSave={
              hasWritePermissions && mode !== "editing" ? saveViz : undefined
            }
            hasUnsavedChanges={hasUnsavedChanges}
            hasWritePermissions={hasWritePermissions}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={onToggleSidebar}
          />
        </Box>
      )}
    </Box>
  );
}

export default memo(VitessceViewer);
