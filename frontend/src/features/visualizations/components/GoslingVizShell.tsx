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
import { type ComponentProps, memo, useMemo } from "react";
import { useDatasetFiltersStore } from "../../../hooks/useDatasetFiltersStore.ts";
import type { components } from "../../../types/schema";
import { useGetPaginatedProjectDatasets } from "../../datasets/api/useDatasets";
import { useUpdateVisualization } from "../api/useVisualizations";
import formatVisualization from "../utils/formatVisualization.ts";
import GoslingViewer from "./GoslingViewer.tsx";

type Dataset = components["schemas"]["DatasetWithTagsOut"];
type Visualization = components["schemas"]["VisualizationOut"];

interface GoslingVizShellProps {
  projectId: string;
  permissions: number;
  selectedVizId?: string;
  selectedViz?: Visualization;
  sidebar: React.ReactNode;
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

function GoslingVizShell({
  projectId,
  permissions,
  selectedVizId,
  selectedViz,
  sidebar,
}: GoslingVizShellProps) {
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
          } as const
        )[permissions as 0 | 1 | 2 | 3] ?? "guest"
      }
      isChatMode={false}
      hideDataPanel
    >
      <DndWrapper>
        <Box sx={{ height: "100%", position: "relative" }}>
          <Stack direction="row" sx={{ height: "100%" }}>
            <Box sx={{ width: 400, flexShrink: 0, overflowY: "auto", p: 2 }}>
              {sidebar}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
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

export default memo(GoslingVizShell);
