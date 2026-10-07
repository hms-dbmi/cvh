import { useCallback, useEffect, useMemo, useState } from "react";
import { useVisualizationFiltersStore } from "@/features/visualizations/hooks/useVisualizationFiltersStore";
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
  // Lives here rather than in a shell so it survives switching between
  // Gosling and Vitessce visualizations.
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((open) => !open);
    // Vitessce's grid (react-grid-layout's WidthProvider) only re-measures on
    // window resize, not when its container widens. Nudge it once the new
    // layout has rendered.
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }, []);

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

  // Backend enforces the enum; narrow here so props stay typesafe.
  const tool: "gosling" | "vitessce" =
    selectedViz?.tool === "vitessce" ? "vitessce" : "gosling";
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
        <DataList showVitessceWarning={isVitessce} showActions tool={tool} />
      </>
    ),
    [projectId, selectedVizId, permissions, isVitessce],
  );

  return isVitessce ? (
    <VitessceVizShell
      permissions={permissions}
      selectedVizId={selectedVizId}
      sidebar={sidebar}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={toggleSidebar}
    />
  ) : (
    <GoslingVizShell
      projectId={projectId}
      permissions={permissions}
      selectedVizId={selectedVizId}
      selectedViz={selectedViz}
      sidebar={sidebar}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={toggleSidebar}
    />
  );
}

export default VisualizationViewer;
