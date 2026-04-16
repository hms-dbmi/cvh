import "gosling-designer-vec/build/style.css";

import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {
  AppStateProvider,
  type GDData,
  useGoslingDndHandlers,
} from "gosling-designer-vec";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { useDatasetFiltersStore } from "../../../hooks/useDatasetFiltersStore.ts";
import { useVisualizationFiltersStore } from "../../../hooks/useVisualizationFiltersStore";
import type { components } from "../../../types/schema";
import { useGetPaginatedProjectDatasets } from "../../datasets/api/useDatasets";
import {
  useGetProjectVisualizations,
  useGetVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations";
import formatVisualization from "../utils/formatVisualization.ts";
import DataList from "./DataList.tsx";
import GoslingViewer from "./GoslingViewer.tsx";
import VisualizationsList from "./VisualizationsList.tsx";
import VitessceViewer from "./VitessceViewer.tsx";

type Dataset = components["schemas"]["DatasetWithTagsOut"];

interface VisualizationViewerProps {
  projectId: string;
  permissions: number;
}

const formatCvhDatasetsAsGoslingDatasets = (datasets: Dataset[]): GDData[] => {
  return datasets.map((dataset) => ({
    type: dataset.file_type,
    name: dataset.name,
    id: dataset.uuid,
    metadata: {},
    url: dataset.source_url,
    assembly: dataset?.assembly ?? undefined,
    indexURL: dataset?.index_url ?? undefined,
    header: dataset?.headers ?? undefined,
    separator: dataset?.separator ?? undefined,
    note: dataset?.description ?? undefined,
    rowNames: dataset?.row_names ?? undefined,
    ...(dataset.file_type === "csv"
      ? { fields: dataset?.data_column ?? undefined }
      : { optionalFields: dataset?.data_column ?? undefined }),
    tags: dataset.tags.map((t) => [t.key, t.tag]),
  })) as GDData[];
};

function DndWrapper({ children }: { children: React.ReactNode }) {
  const { collisionDetection, onDragStart, onDragEnd, dragOverlay } =
    useGoslingDndHandlers({ dropAnimation: null });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
      {dragOverlay}
    </DndContext>
  );
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

  // Auto-select first visualization on load
  useEffect(() => {
    if (!selectedVizId && visualizations?.length) {
      setSelectedVizId(visualizations[0].uuid);
    }
  }, [selectedVizId, visualizations]);

  // Dataset fetching for GoslingDesignerVEC
  const selectedAssemblies = useDatasetFiltersStore(
    (state) => state.selectedAssemblies,
  );
  const selectedFileTypes = useDatasetFiltersStore(
    (state) => state.selectedFileTypes,
  );
  const datasetNameSubstring = useDatasetFiltersStore(
    (state) => state.nameSubstring,
  );
  const datasetSelectedTags = useDatasetFiltersStore(
    (state) => state.selectedTags,
  );

  const { data: datasets } = useGetPaginatedProjectDatasets({
    projectId,
    tags: datasetSelectedTags,
    fileTypes: selectedFileTypes,
    assemblies: selectedAssemblies,
    name: datasetNameSubstring,
  });

  const allDatasets: Required<Dataset>[] =
    datasets?.pages.flatMap((page) => page.items as Required<Dataset>[]) ?? [];

  const formattedDatasets = useMemo(() => {
    if (!allDatasets.length) return [];
    return formatCvhDatasetsAsGoslingDatasets(allDatasets);
  }, [allDatasets]);

  const formattedVisualization = formatVisualization(selectedViz);

  const { mutate: updateViz } = useUpdateVisualization();

  const tool = selectedViz?.tool ?? "gosling";
  const isVitessce = tool === "vitessce";

  const hasWritePermissions = permissions >= 2;

  const onChange = useMemo<ComponentProps<typeof AppStateProvider>["onChange"]>(
    () =>
      ({ vis, nTracks, nDatasets }) => {
        const conf = vis?.spec;
        if (!selectedVizId || !hasWritePermissions) return;
        updateViz({
          body: { conf, n_tracks: nTracks, n_datasets: nDatasets },
          params: { path: { visualization_uuid: selectedVizId } },
        });
      },
    [updateViz, selectedVizId, hasWritePermissions],
  );

  return (
    <AppStateProvider
      populateFromParams
      data={formattedDatasets}
      visualization={formattedVisualization}
      onChange={onChange}
      userMode={
        (
          {
            0: "guest",
            1: "viewer",
            2: "editor",
            3: "admin",
          } as Record<number, string>
        )[permissions] ?? "guest"
      }
      isChatMode={false}
      hideDataPanel
    >
      <DndWrapper>
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
      </DndWrapper>
    </AppStateProvider>
  );
}

export default VisualizationViewer;
