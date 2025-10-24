import { ComponentProps, useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";

import { GoslingDesignerVEC, VisSchema } from "gosling-designer-vec";
import "gosling-designer-vec/build/style.css";
import VisualizationsList from "./VisualizationsList.tsx";
import DataList, { DatasetActionsMenu } from "./DataList.tsx";
import { useGetVisualization } from "../api/useVisualizations.ts";
import type { components } from "../../../types/schema";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";
import { useUpdateVisualization } from "../api/useVisualizations";
import { useGetPaginatedProjectDatasets } from "../../datasets/api/useDatasets";
import { useDatasetFiltersStore } from "../../../hooks/useDatasetFiltersStore.ts";
import formatVisualization from "../utils/formatVisualization.ts";
type Dataset = components["schemas"]["DatasetWithTagsOut"];

interface GoslingViewerProps {
  projectId: string;
  datasets?: Dataset[];
  readonly?: boolean;
}

// TODO: This needs to be revisited to support fields etc
const formatCvhDatasetsAsGoslingDatasets = (datasets: Dataset[]) => {
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
    ...(dataset.file_type === "csv"
      ? { fields: dataset?.data_column ?? undefined }
      : { optionalFields: dataset?.data_column ?? undefined }),
    tags: dataset.tags.map((t) => [t.key, t.tag]),
    // name: dataset.source_url.replace(/^.*[\\/]/, ""),
  })) as ComponentProps<typeof GoslingDesignerVEC>["data"];
};

const useFormattedDatasets = (datasets: Dataset[]) => {
  return useMemo(() => {
    if (!datasets) {
      return [];
    }
    return formatCvhDatasetsAsGoslingDatasets(datasets);
  }, [datasets]);
};

function GoslingViewer({ projectId }: GoslingViewerProps) {
  const [selectedVizId, setSelectedVizId] = useState<string>();

  /* eslint-disable */
  // @ts-ignore TODO: Remove ignore.
  const { data } = useGetVisualization(selectedVizId);
  /* eslint-enable */

  /* const saveVisualization = useCallback(() => {
    if (changedCode) {
      onSave?.(changedCode);
    }
    close();
  }, [onSave, close, changedCode]); */

  const selectedAssemblies = useDatasetFiltersStore(
    (state) => state.selectedAssemblies
  );
  const selectedFileTypes = useDatasetFiltersStore(
    (state) => state.selectedFileTypes
  );

  const nameSubstring = useDatasetFiltersStore((state) => state.nameSubstring);

  const selectedTags = useDatasetFiltersStore((state) => state.selectedTags);

  const { data: datasets } = useGetPaginatedProjectDatasets({
    projectId,
    tags: selectedTags,
    fileTypes: selectedFileTypes,
    assemblies: selectedAssemblies,
    name: nameSubstring,
  });

  const allDatasets: Required<Dataset>[] =
    datasets?.pages.flatMap((page) => page.items as Required<Dataset>[]) ?? [];

  const formattedDatasets = useFormattedDatasets(allDatasets);
  const formattedVisualization = formatVisualization(data);

  const { mutate: updateViz } = useUpdateVisualization();
  const { toastError } = useSnackbarActions();

  const selectViz = useCallback(
    (id: string) => setSelectedVizId(id),
    [setSelectedVizId]
  );

  const saveViz = useCallback(
    ({
      vis,
      nTracks,
      nDatasets,
    }: {
      vis: VisSchema.GDVis;
      nTracks: number;
      nDatasets: number;
    }) => {
      const conf = vis?.spec;
      const n_tracks = nTracks;
      const n_datasets = nDatasets;

      try {
        if (!selectedVizId) {
          return;
        }
        updateViz({
          body: { conf, n_tracks, n_datasets },
          params: {
            path: { visualization_uuid: selectedVizId },
          },
        });
      } catch (e) {
        toastError("Error saving visualization");
        console.error(e);
      }
    },
    [updateViz, toastError, selectedVizId]
  );

  const publishViz = useCallback(() => {
    try {
      if (!selectedVizId) {
        return;
      }
      updateViz({
        body: { published: true },
        params: {
          path: { visualization_uuid: selectedVizId },
        },
      });
    } catch (e) {
      toastError("Error publishing visualization");
      console.error(e);
    }
  }, [updateViz, toastError, selectedVizId]);

  if (!formattedDatasets) {
    return null;
  }

  return (
    <Box sx={{ height: "100%" }}>
      <GoslingDesignerVEC
        visualization={formattedVisualization} // or `undefined`
        data={formattedDatasets} // or `undefined`
        onChange={saveViz}
        visualizationPanel={
          <VisualizationsList
            projectId={projectId}
            setSelectedVizId={selectViz}
            selectedVizId={selectedVizId}
          />
        }
        DatasetsPanel={DataList}
        DatasetMenuButton={DatasetActionsMenu}
        userMode="admin"
        onPublish={publishViz}
      />
    </Box>
  );
}

export default GoslingViewer;
