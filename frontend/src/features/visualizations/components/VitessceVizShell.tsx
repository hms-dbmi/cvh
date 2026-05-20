import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { lazy, memo, Suspense } from "react";

const VitessceViewer = lazy(() => import("./VitessceViewer.tsx"));

interface VitessceVizShellProps {
  permissions: number;
  selectedVizId?: string;
  sidebar: React.ReactNode;
}

function ViewerFallback() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress />
    </Box>
  );
}

function VitessceVizShell({
  permissions,
  selectedVizId,
  sidebar,
}: VitessceVizShellProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  return (
    <DndContext sensors={sensors}>
      <Box sx={{ height: "100%", position: "relative" }}>
        <Stack direction="row" sx={{ height: "100%" }}>
          <Box sx={{ width: 400, flexShrink: 0, overflowY: "auto", p: 2 }}>
            {sidebar}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
            <Suspense fallback={<ViewerFallback />}>
              <VitessceViewer
                permissions={permissions}
                selectedVizId={selectedVizId}
              />
            </Suspense>
          </Box>
        </Stack>
      </Box>
    </DndContext>
  );
}

export default memo(VitessceVizShell);
