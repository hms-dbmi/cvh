import { ComponentProps, useCallback, useMemo, useState } from "react";
import { Frame } from "@hms-dbmi/gosling-designer-cvh";
import "@hms-dbmi/gosling-designer-cvh/build/style.css";

import { useGetVisualization } from "../api/useVisualizations.ts";
import { Button, Stack } from "@mui/material";
import type { components } from "../../../types/schema";


interface GoslingViewerProps {
    visualizationId: string;
    close: () => void;
    datasets?: components["schemas"]["DatasetOut"][];
    readonly?: boolean;
    onSave?: (newConf: string) => void;
};
  

// TODO: This needs to be revisited to support fields etc
const formatCvhDatasetsAsGoslingDatasets = (datasets: components["schemas"]["DatasetOut"][]) => {
  return datasets.map((dataset) => ({
    datatype: dataset.data_type,
    name: dataset.name,
    id: dataset.name,
    file: {
      url: dataset.source_url,
      name: dataset.source_url.replace(/^.*[\\/]/, ""),
    }
  })) as ComponentProps<typeof Frame>['initialDatasets'];
}

const useFormattedDatasets = (datasets: components["schemas"]["DatasetOut"][]) => {
  return useMemo(() => {
    if (!datasets) {
      return [];
    }
    return formatCvhDatasetsAsGoslingDatasets(datasets);
  }, [datasets]);
}


const readonlyStatusOfPanelsAndModes = {
  data: false,
  'add-data': false,
  'track-selection': true,
  customization: false,
  templates: false,
  editor: false,
  'natural-language': false,
  history: false,
  delta: false,
  explore: false,
  readonly: true
}

const defaultStatusOfPanelsAndModes = {
  data: true,
  'add-data': false,
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


function GoslingViewer({ visualizationId, close, onSave, datasets = [] }: GoslingViewerProps) {
  const readonly = onSave === undefined;
  const { isLoading, isError, data } = useGetVisualization(visualizationId);

  const [changedCode, setChangedCode] = useState("");

  const saveVisualization = useCallback(() => {
    if (changedCode) {
      onSave?.(changedCode);
    }
    close();
  }, [onSave, close, changedCode]);

  const formattedDatasets = useFormattedDatasets(datasets);

  if (isLoading || isError || !data?.conf || !formattedDatasets) {
    return null;
  }


  return (
    <Stack direction='column'>
      <Stack direction='row' justifyContent='center' width='100%'>
        {!readonly && <Button onClick={saveVisualization} aria-label="Save Visualization" variant='contained'>Save Visualization</Button>}
        <Button onClick={close} aria-label="Close Visualization" variant='contained'>Close Visualization</Button>
        </Stack>
      <Frame 
        key={visualizationId}
        initialSpec={data.conf} 
        initialDatasets={formattedDatasets} 
        initialActiveStatusOfPanelsAndModes={
          readonly ? readonlyStatusOfPanelsAndModes : defaultStatusOfPanelsAndModes
        }
        onCodeChange={setChangedCode}
      />
    </Stack>
  );
}

export default GoslingViewer;
