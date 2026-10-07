import { useBlocker } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useVisualizationFiltersStore } from "@/features/visualizations/hooks/useVisualizationFiltersStore";
import {
  useGetProjectVisualizations,
  useGetVisualization,
} from "../api/useVisualizations";
import { useUnsavedAnnotationsStore } from "../hooks/useUnsavedAnnotationsStore";
import DataList from "./DataList.tsx";
import GoslingVizShell from "./GoslingVizShell.tsx";
import UnsavedAnnotationsDialog from "./UnsavedAnnotationsDialog.tsx";
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

  // Switching visualizations from the sidebar isn't a navigation, so the
  // blocker below doesn't see it; ask here instead.
  const selectViz = useCallback((id?: string) => {
    useUnsavedAnnotationsStore
      .getState()
      .confirmLeave(() => setSelectedVizId(id));
  }, []);

  // Leaving the workspace (another workspace, another page) waits on the
  // unsaved-annotations dialog; closing or reloading the tab gets the
  // browser's own prompt.
  useBlocker({
    shouldBlockFn: () =>
      new Promise<boolean>((resolve) =>
        useUnsavedAnnotationsStore.getState().confirmLeave(
          () => resolve(false),
          () => resolve(true),
        ),
      ),
    enableBeforeUnload: () =>
      useUnsavedAnnotationsStore.getState().hasUnsavedAnnotations,
  });

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
          setSelectedVizId={selectViz}
          selectedVizId={selectedVizId}
          permissions={permissions}
        />
        <DataList showVitessceWarning={isVitessce} showActions tool={tool} />
      </>
    ),
    [projectId, selectedVizId, permissions, isVitessce, selectViz],
  );

  return (
    <>
      {isVitessce ? (
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
      )}
      <UnsavedAnnotationsDialog />
    </>
  );
}

export default VisualizationViewer;
