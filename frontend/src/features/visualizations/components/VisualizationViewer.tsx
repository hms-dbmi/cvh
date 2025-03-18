import { ComponentProps, useCallback, useState } from "react";
import { Frame } from "@hms-dbmi/gosling-designer-cvh";
import "@hms-dbmi/gosling-designer-cvh/build/style.css";

import { useGetVisualization } from "../api/useVisualizations.ts";
import { Button, Stack } from "@mui/material";
import type { components } from "../../../types/schema";

type VisualizationViewerProps = {
  visualizationId: string;
  close: () => void;
  datasets?: {items: components["schemas"]["DatasetOut"][]};
  readonly?: boolean;
  onSave?: (newConf: string) => void;
};

const readonlyStatusOfPanelsAndModes = {
  data: false,
  'track-selection': true,
  customization: false,
  templates: false,
  editor: false,
  'natural-language': false,
  history: false,
  delta: false,
  explore: true,
  readonly: true
}

const defaultStatusOfPanelsAndModes = {
  data: false,
  'track-selection': true,
  customization: true,
  templates: true,
  editor: true,
  'natural-language': false,
  history: true,
  delta: false,
  explore: false,
  readonly: true,
}

// TODO: This needs to be revisited to support fields etc
const formatCvhDatasetsAsGoslingDatasets = (datasets: {items: components["schemas"]["DatasetOut"][]}) => {
  return datasets.items.map((dataset) => ({
    datatype: dataset.data_type,
    name: dataset.name,
    id: dataset.name,
    file: {
      url: dataset.source_url,
      name: dataset.source_url.replace(/^.*[\\\/]/, ""),
    }
  })) as ComponentProps<typeof Frame>['initialDatasets'];
}


function VisualizationViewer({ visualizationId, close, onSave, datasets = {items: []} }: VisualizationViewerProps) {
  const readonly = onSave === undefined;
  const { isLoading, isError, data } = useGetVisualization(visualizationId);


  const [changedCode, setChangedCode] = useState<string>();

  const saveVisualization = useCallback(() => {
    console.log("Save visualization");
    if (changedCode) {
      onSave?.(changedCode);
    }
    close();
  }, [onSave, close, changedCode]);

  if (isLoading || isError || !data?.conf || !datasets) {
    return null;
  }

  const formattedDatasets = formatCvhDatasetsAsGoslingDatasets(datasets);

  return (
    <Stack direction='column'>
      <Stack direction='row' justifyContent='center' width='100%'>
        {!readonly && <Button onClick={saveVisualization} aria-label="Save Visualization" variant='contained'>Save Visualization</Button>}
        <Button onClick={close} aria-label="Close Visualization" variant='contained'>Close Visualization</Button>
        </Stack>
      <Frame initialSpec={data.conf} initialDatasets={formattedDatasets} initialActiveStatusOfPanelsAndModes={
        readonly ? readonlyStatusOfPanelsAndModes : defaultStatusOfPanelsAndModes
      }
        onCodeChange={setChangedCode}
      />
    </Stack>
  );
}

export default VisualizationViewer;
