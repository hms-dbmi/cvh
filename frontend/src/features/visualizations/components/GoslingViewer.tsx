import Box from "@mui/material/Box";
import { GoslingDesignerVEC, type VisSchema } from "gosling-designer-vec";
import { type ComponentProps, useCallback, useMemo, useState } from "react";
import "gosling-designer-vec/build/style.css";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";
import { useDatasetFiltersStore } from "../../../hooks/useDatasetFiltersStore.ts";
import type { components } from "../../../types/schema";
import { useGetPaginatedProjectDatasets } from "../../datasets/api/useDatasets";
import { useUpdateVisualization } from "../api/useVisualizations";
import { useGetVisualization } from "../api/useVisualizations.ts";
import formatVisualization from "../utils/formatVisualization.ts";
import DataList, { DatasetActionsMenu } from "./DataList.tsx";
import PublishedVizMenu from "./PublishedVizMenu.tsx";
import VisualizationsList from "./VisualizationsList.tsx";

type Dataset = components["schemas"]["DatasetWithTagsOut"];

interface GoslingViewerProps {
  projectId: string;
  datasets?: Dataset[];
  readonly?: boolean;
  permissions: number;
}

const PERMISSIONS: Record<number, string> = {
  0: "guest",
  1: "viewer",
  2: "editor",
  3: "admin",
};

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
    note: dataset?.description ?? undefined,
    rowNames: dataset?.row_names ?? undefined,
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

function GoslingViewer({ projectId, permissions }: GoslingViewerProps) {
  const [selectedVizId, setSelectedVizId] = useState<string | undefined>(
    undefined,
  );

  /* eslint-disable */
  // @ts-expect-error TODO: Remove ignore.
  const { data } = useGetVisualization(selectedVizId);
  /* eslint-enable */

  /* const saveVisualization = useCallback(() => {
    if (changedCode) {
      onSave?.(changedCode);
    }
    close();
  }, [onSave, close, changedCode]); */

  const selectedAssemblies = useDatasetFiltersStore(
    (state) => state.selectedAssemblies,
  );
  const selectedFileTypes = useDatasetFiltersStore(
    (state) => state.selectedFileTypes,
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

  const hasWritePermissions = permissions >= 2;
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
        if (!selectedVizId || !hasWritePermissions) {
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
    [updateViz, toastError, selectedVizId, hasWritePermissions],
  );

  const publishViz = useCallback(() => {
    try {
      if (!selectedVizId || !hasWritePermissions) {
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
  }, [updateViz, toastError, selectedVizId, hasWritePermissions]);

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
            setSelectedVizId={setSelectedVizId}
            selectedVizId={selectedVizId}
            permissions={permissions}
          />
        }
        DatasetsPanel={DataList}
        DatasetMenuButton={hasWritePermissions ? DatasetActionsMenu : undefined}
        // @ts-expect-error TODO: Remove ignore.
        userMode={PERMISSIONS?.[permissions] ?? "guest"}
        onPublish={publishViz}
        PublishMenu={PublishedVizMenu}
      />
    </Box>
  );
}

export default GoslingViewer;
