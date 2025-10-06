import { ComponentProps, useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";

import { GoslingDesignerVEC } from "gosling-designer-vec";
import "gosling-designer-vec/build/style.css";
import VisualizationsList from "./VisualizationsList.tsx";
import DataList from "./DataList.tsx";
import { useGetVisualization } from "../api/useVisualizations.ts";
import type { components } from "../../../types/schema";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";
import { useUpdateVisualization } from "../api/useVisualizations";
interface GoslingViewerProps {
  projectId: string;
  datasets?: components["schemas"]["DatasetOut"][];
  readonly?: boolean;
}

// TODO: This needs to be revisited to support fields etc
const formatCvhDatasetsAsGoslingDatasets = (
  datasets: components["schemas"]["DatasetOut"][]
) => {
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
    // name: dataset.source_url.replace(/^.*[\\/]/, ""),
  })) as ComponentProps<typeof GoslingDesignerVEC>["data"];
};

const useFormattedDatasets = (
  datasets: components["schemas"]["DatasetOut"][]
) => {
  return useMemo(() => {
    if (!datasets) {
      return [];
    }
    return formatCvhDatasetsAsGoslingDatasets(datasets);
  }, [datasets]);
};

const formatVisualization = (
  viz?: components["schemas"]["VisualizationOut"]
) => {
  if (!viz?.conf) {
    return undefined;
  }

  const conf = viz?.conf ?? {};

  return {
    note: "",
    name: viz.name,
    id: viz.uuid,
    spec: conf,
    usedDataIds: [],
    // name: dataset.source_url.replace(/^.*[\\/]/, ""),
  } as ComponentProps<typeof GoslingDesignerVEC>["visualization"];
};

function GoslingViewer({ projectId, datasets = [] }: GoslingViewerProps) {
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

  const formattedDatasets = useFormattedDatasets(datasets);
  const formattedVisualization = formatVisualization(data);

  const { mutate: updateViz } = useUpdateVisualization();
  const { toastError } = useSnackbarActions();

  const selectViz = useCallback(
    (id: string) => setSelectedVizId(id),
    [setSelectedVizId]
  );

  console.log(selectedVizId)

  const saveViz = useCallback(
    (newConf: string) => {
      console.log(newConf)
      try {
        if (!selectedVizId) {
          return;
        }
        const conf = JSON.parse(newConf);
        updateViz({
          body: { conf },
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

  if (!formattedDatasets) {
    return null;
  }

  return (
    <Box sx={{ height: "100%" }}>
      <GoslingDesignerVEC
        visualization={formattedVisualization} // or `undefined`
        data={formattedDatasets} // or `undefined`
        onCodeChange={saveViz}
      >
        <Box
          sx={{
            background: "#FFF",
          }}
        >
          <VisualizationsList
            projectId={projectId}
            setSelectedVizId={selectViz}
            selectedVizId={selectedVizId}
          />
          <DataList projectId={projectId} datasets={datasets} />
        </Box>
      </GoslingDesignerVEC>
    </Box>
  );
}

export default GoslingViewer;
