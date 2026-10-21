import Box from "@mui/material/Box";
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  FileCode,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import {
  type ModeWidgetProps,
  useActiveStatusOfPanelsAndModesValue,
  useCanRedo,
  useCanUndo,
  useOnPublishValue,
  useRedo,
  useToggleSetting,
  useUndo,
} from "gosling-designer-vec";
import { createContext, useContext } from "react";
import { BarIconButton, BottomBar, type Mode } from "./BottomBar.tsx";

// CVH state the Gosling designer doesn't know about. GoslingViewer provides
// it; the designer renders GoslingBottomBar in place of its own bar.
export interface GoslingBottomBarContextValue {
  visualizationID?: string;
  // From CVH's server data, like the Vitessce bar. The designer's own
  // published flag is only set after it loads, so the button would briefly
  // read "Make Public" for a published visualization.
  published?: boolean;
  hasWritePermissions: boolean;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const GoslingBottomBarContext =
  createContext<GoslingBottomBarContextValue | null>(null);

// Match the designer's side panels (both 400px) and code editor, which the
// bar sits clear of (the designer's built-in bar does the same). These
// mirror gosling-designer-vec internals, which it doesn't export.
export const GOSLING_PANEL_WIDTH = 400;
const CODE_EDITOR_OFFSET = 416;

/**
 * CVH's BottomBar for Gosling visualizations, passed to gosling-designer-vec
 * as its `ModeWidget`, so both viewers share one bar and sharing menu. Mode
 * and undo/redo come from the designer's own hooks.
 */
export default function GoslingBottomBar({
  onJsonExport,
  onPngExport,
}: ModeWidgetProps) {
  const context = useContext(GoslingBottomBarContext);
  const status = useActiveStatusOfPanelsAndModesValue();
  const toggleSetting = useToggleSetting();
  const publish = useOnPublishValue();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  if (!context) return null;
  const { hasWritePermissions } = context;
  const isExploring = status.isPresentMode;
  const mode: Mode = isExploring ? "exploring" : "editing";

  // Editing changes the spec, so it gets undo/redo; exploring offers the
  // designer's exports.
  const extraActions = !hasWritePermissions ? null : isExploring ? (
    <>
      <BarIconButton
        label="Export specification"
        icon={<FileCode size={20} />}
        onClick={onJsonExport}
      />
      <BarIconButton
        label="Export image"
        icon={<ImageIcon size={20} />}
        onClick={onPngExport}
      />
    </>
  ) : (
    <>
      <BarIconButton
        label="Undo"
        icon={<ArrowUUpLeft size={20} />}
        onClick={undo}
        disabled={!canUndo}
      />
      <BarIconButton
        label="Redo"
        icon={<ArrowUUpRight size={20} />}
        onClick={redo}
        disabled={!canRedo}
      />
    </>
  );

  return (
    <Box
      sx={{
        position: "absolute",
        left: 0,
        // Center over the canvas, clear of the right panel when it's open.
        right: hasWritePermissions && !isExploring ? GOSLING_PANEL_WIDTH : 0,
        bottom: status._editor ? CODE_EDITOR_OFFSET : 16,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <Box sx={{ pointerEvents: "auto" }}>
        <BottomBar
          mode={mode}
          onModeChange={(next) =>
            toggleSetting("isPresentMode", next === "exploring")
          }
          // Read-only members can't edit Gosling safely, so they only explore.
          modes={hasWritePermissions ? ["editing", "exploring"] : ["exploring"]}
          published={context.published}
          visualizationID={context.visualizationID}
          viewer="gosling"
          onPublish={
            // Wait for the visualization to load, so an already-published
            // one never briefly offers "Make Public".
            hasWritePermissions && context.published !== undefined
              ? () => {
                  publish?.(true);
                  toggleSetting("_isPublished", true);
                }
              : undefined
          }
          onUnpublish={() => toggleSetting("_isPublished", false)}
          // Exploring doesn't change the spec, so there's nothing to save.
          onSave={
            hasWritePermissions && !isExploring ? context.onSave : undefined
          }
          hasUnsavedChanges={context.hasUnsavedChanges}
          hasWritePermissions={hasWritePermissions}
          isSidebarOpen={context.isSidebarOpen}
          onToggleSidebar={context.onToggleSidebar}
          extraActions={extraActions}
        />
      </Box>
    </Box>
  );
}
