import Box from "@mui/material/Box";
import { GoslingDesignerVEC } from "gosling-designer-vec";
import "gosling-designer-vec/build/style.css";
import { memo } from "react";
import { DatasetActionsMenu } from "./DataList.tsx";
import PublishedVizMenu from "./PublishedVizMenu.tsx";

interface GoslingViewerProps {
  permissions: number;
}

function GoslingViewer({ permissions }: GoslingViewerProps) {
  const hasWritePermissions = permissions >= 2;

  return (
    <Box sx={{ height: "100%" }}>
      <GoslingDesignerVEC
        visualizationPanel={null}
        DatasetMenuButton={hasWritePermissions ? DatasetActionsMenu : undefined}
        PublishMenu={PublishedVizMenu}
        isLeftPanelOpen={false}
        externalDndContext
      />
    </Box>
  );
}

export default memo(GoslingViewer);
