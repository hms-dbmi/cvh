import Box from "@mui/material/Box";
import { GoslingDesignerVEC, useToggleSetting } from "gosling-designer-vec";
import "gosling-designer-vec/build/style.css";
import { memo, useCallback } from "react";
import { SidebarToggleButton } from "./BottomBar.tsx";
import { DatasetActionsMenu } from "./DataList.tsx";
import PublishedVizMenu from "./PublishedVizMenu.tsx";

interface GoslingViewerProps {
  permissions: number;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

function GoslingPublishedVizMenu({
  visualizationID,
  closeMenu,
}: {
  visualizationID: string;
  closeMenu: () => void;
}) {
  const toggleSetting = useToggleSetting();
  const handleUnpublish = useCallback(() => {
    toggleSetting("_isPublished", false);
  }, [toggleSetting]);
  return (
    <PublishedVizMenu
      visualizationID={visualizationID}
      closeMenu={closeMenu}
      onUnpublish={handleUnpublish}
    />
  );
}

function GoslingViewer({
  permissions,
  isSidebarOpen,
  onToggleSidebar,
}: GoslingViewerProps) {
  const hasWritePermissions = permissions >= 2;

  return (
    <Box sx={{ height: "100%" }}>
      <GoslingDesignerVEC
        visualizationPanel={null}
        DatasetMenuButton={hasWritePermissions ? DatasetActionsMenu : undefined}
        PublishMenu={GoslingPublishedVizMenu}
        isLeftPanelOpen={false}
        modeWidgetActions={
          <SidebarToggleButton
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={onToggleSidebar}
          />
        }
        externalDndContext
        classNames={{
          modeWidget: hasWritePermissions
            ? "w-auto left-0 right-[400px]"
            : undefined,
        }}
      />
    </Box>
  );
}

export default memo(GoslingViewer);
