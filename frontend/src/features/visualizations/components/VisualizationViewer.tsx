import { useEffect, useMemo, useState } from "react";
import { useVisualizationFiltersStore } from "../../../hooks/useVisualizationFiltersStore";
import {
  useGetProjectVisualizations,
  useGetVisualization,
} from "../api/useVisualizations";
import DataList from "./DataList.tsx";
import GoslingVizShell from "./GoslingVizShell.tsx";
import VisualizationsList from "./VisualizationsList.tsx";
import VitessceVizShell from "./VitessceVizShell.tsx";

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

  const vizNameSubstring = useVisualizationFiltersStore(
    (state) => state.nameSubstring,
  );
  const vizSelectedTags = useVisualizationFiltersStore(
    (state) => state.selectedTags,
  );

  const { data: visualizations } = useGetProjectVisualizations({
    projectId,
    tags: vizSelectedTags,
    name: vizNameSubstring,
  });

  // @ts-expect-error TODO: Remove ignore.
  const { data: selectedViz } = useGetVisualization(selectedVizId);

  useEffect(() => {
    if (!selectedVizId && visualizations?.length) {
      setSelectedVizId(visualizations[0].uuid);
    }
  }, [selectedVizId, visualizations]);

  const tool = selectedViz?.tool ?? "gosling";
  const isVitessce = tool === "vitessce";

  const sidebar = useMemo(
    () => (
      <>
        <VisualizationsList
          projectId={projectId}
          setSelectedVizId={setSelectedVizId}
          selectedVizId={selectedVizId}
          permissions={permissions}
        />
        <DataList
          showVitessceWarning={isVitessce}
          showActions
          disableDrag={isVitessce}
        />
      </>
    ),
    [projectId, selectedVizId, permissions, isVitessce],
  );

  return isVitessce ? (
    <VitessceVizShell
      permissions={permissions}
      selectedVizId={selectedVizId}
      sidebar={sidebar}
    />
  ) : (
    <GoslingVizShell
      projectId={projectId}
      permissions={permissions}
      selectedVizId={selectedVizId}
      selectedViz={selectedViz}
      sidebar={sidebar}
    />
  );
}

export default VisualizationViewer;
