import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useCallback, useMemo, useRef, useState } from "react";
import { Vitessce } from "vitessce";
import "react-grid-layout/css/styles.css";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";
import {
  useGetVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations";
import VisualizationsList from "./VisualizationsList.tsx";

interface VitessceViewerProps {
  projectId: string;
  permissions: number;
}

function VitessceViewer({ projectId, permissions }: VitessceViewerProps) {
  const [selectedVizId, setSelectedVizId] = useState<string | undefined>(
    undefined,
  );

  // @ts-expect-error TODO: Remove ignore.
  const { data } = useGetVisualization(selectedVizId);

  const { mutate: updateViz } = useUpdateVisualization();
  const { toastError } = useSnackbarActions();

  const hasWritePermissions = permissions >= 2;

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

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

  return (
    <Stack direction="row" sx={{ height: "100%" }}>
      <Box sx={{ width: 350, flexShrink: 0, overflowY: "auto", p: 2 }}>
        <VisualizationsList
          projectId={projectId}
          setSelectedVizId={setSelectedVizId}
          selectedVizId={selectedVizId}
          permissions={permissions}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {data?.conf && (
          <Vitessce
            config={data.conf}
            height={1000}
            theme="light"
            onConfigChange={saveViz}
          />
        )}
      </Box>
    </Stack>
  );
}

export default VitessceViewer;
