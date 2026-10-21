import Box from "@mui/material/Box";
import { GoslingDesignerVEC } from "gosling-designer-vec";
import "gosling-designer-vec/build/style.css";
import "../gosling-overrides.css";
import { memo, useMemo } from "react";
import { DatasetActionsMenu } from "./DataList.tsx";
import GoslingBottomBar, {
  GoslingBottomBarContext,
  type GoslingBottomBarContextValue,
} from "./GoslingBottomBar.tsx";

interface GoslingViewerProps
  extends Omit<GoslingBottomBarContextValue, "hasWritePermissions"> {
  permissions: number;
}

function GoslingViewer({
  permissions,
  visualizationID,
  published,
  onSave,
  hasUnsavedChanges,
  isSidebarOpen,
  onToggleSidebar,
}: GoslingViewerProps) {
  const hasWritePermissions = permissions >= 2;
  const bottomBar = useMemo(
    () => ({
      visualizationID,
      published,
      hasWritePermissions,
      onSave,
      hasUnsavedChanges,
      isSidebarOpen,
      onToggleSidebar,
    }),
    [
      visualizationID,
      published,
      hasWritePermissions,
      onSave,
      hasUnsavedChanges,
      isSidebarOpen,
      onToggleSidebar,
    ],
  );

  return (
    <Box sx={{ height: "100%" }}>
      <GoslingBottomBarContext.Provider value={bottomBar}>
        <GoslingDesignerVEC
          visualizationPanel={null}
          DatasetMenuButton={
            hasWritePermissions ? DatasetActionsMenu : undefined
          }
          isLeftPanelOpen={false}
          // CVH's own bar, so Gosling and Vitessce share one bar and menu.
          ModeWidget={GoslingBottomBar}
          // Hook for gosling-overrides.css (canvas spacing, background and
          // the header's shadow).
          classNames={{ canvas: "cvh-gosling-canvas" }}
          // The designer defaults to `calc(100vh - 44px)`, 20px taller than
          // the space below CVH's 64px header, which let the page scroll.
          style={{ height: "100%" }}
          externalDndContext
        />
      </GoslingBottomBarContext.Provider>
    </Box>
  );
}

export default memo(GoslingViewer);
