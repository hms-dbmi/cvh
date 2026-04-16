import Box from "@mui/material/Box";
import { GoslingDesignerVEC } from "gosling-designer-vec";
import "gosling-designer-vec/build/style.css";
import { useCallback } from "react";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";
import { useUpdateVisualization } from "../api/useVisualizations";
import { DatasetActionsMenu } from "./DataList.tsx";
import PublishedVizMenu from "./PublishedVizMenu.tsx";

interface GoslingViewerProps {
  projectId: string;
  permissions: number;
  selectedVizId?: string;
}

function GoslingViewer({ permissions, selectedVizId }: GoslingViewerProps) {
  const { mutate: updateViz } = useUpdateVisualization();
  const { toastError } = useSnackbarActions();
  const hasWritePermissions = permissions >= 2;

  const publishViz = useCallback(() => {
    try {
      if (!selectedVizId || !hasWritePermissions) return;
      updateViz({
        body: { published: true },
        params: { path: { visualization_uuid: selectedVizId } },
      });
    } catch (e) {
      toastError("Error publishing visualization");
      console.error(e);
    }
  }, [updateViz, toastError, selectedVizId, hasWritePermissions]);

  return (
    <Box sx={{ height: "100%" }}>
      <GoslingDesignerVEC
        visualizationPanel={null}
        DatasetMenuButton={hasWritePermissions ? DatasetActionsMenu : undefined}
        onPublish={publishViz}
        PublishMenu={PublishedVizMenu}
        isLeftPanelOpen={false}
        externalDndContext
      />
    </Box>
  );
}

export default GoslingViewer;
