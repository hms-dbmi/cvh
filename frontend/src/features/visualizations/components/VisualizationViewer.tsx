import "gosling-designer-vec/build/style.css";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useEffect, useState } from "react";
import { useVisualizationFiltersStore } from "../../../hooks/useVisualizationFiltersStore";
import {
  useGetProjectVisualizations,
  useGetVisualization,
} from "../api/useVisualizations";
import DataList from "./DataList.tsx";
import GoslingViewer from "./GoslingViewer.tsx";
import VisualizationsList from "./VisualizationsList.tsx";
import VitessceViewer from "./VitessceViewer.tsx";

interface VisualizationViewerProps {
  projectId: string;
  permissions: number;
}

function VisualizationViewer({
  projectId,
  permissions,
}: VisualizationViewerProps) {
  const [selectedVizId, setSelectedVizId] = useState<string | undefined>(
    undefined,
  );

  const nameSubstring = useVisualizationFiltersStore(
    (state) => state.nameSubstring,
  );
  const selectedTags = useVisualizationFiltersStore(
    (state) => state.selectedTags,
  );

  const { data: visualizations } = useGetProjectVisualizations({
    projectId,
    tags: selectedTags,
    name: nameSubstring,
  });

  // @ts-expect-error TODO: Remove ignore.
  const { data: selectedViz } = useGetVisualization(selectedVizId);

  // Auto-select first visualization on load
  useEffect(() => {
    if (!selectedVizId && visualizations?.length) {
      setSelectedVizId(visualizations[0].uuid);
    }
  }, [selectedVizId, visualizations]);

  const tool = selectedViz?.tool ?? "gosling";
  const isVitessce = tool === "vitessce";

  return (
    <Box sx={{ height: "100%", position: "relative" }}>
      <Stack direction="row" sx={{ height: "100%" }}>
        <Box sx={{ width: 400, flexShrink: 0, overflowY: "auto", p: 2 }}>
          <VisualizationsList
            projectId={projectId}
            setSelectedVizId={setSelectedVizId}
            selectedVizId={selectedVizId}
            permissions={permissions}
            disabledTools={["vitessce"]}
          />
          <DataList showVitessceWarning={isVitessce} showActions />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
          {/* TODO: Re-enable VitessceViewer once ready */}
          <GoslingViewer
            projectId={projectId}
            permissions={permissions}
            selectedVizId={selectedVizId}
          />
        </Box>
      </Stack>
    </Box>
  );
}

export default VisualizationViewer;
