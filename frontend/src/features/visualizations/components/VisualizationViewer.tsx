import "gosling-designer-vec/build/style.css";

import type { components } from "../../../types/schema";
import GoslingViewer from "./GoslingViewer.tsx";


interface VisualizationViewerProps {
  visualizationId: string;
  close: () => void;
  visualizationType: string;
  datasets?: components["schemas"]["DatasetOut"][];
  readonly?: boolean;
  onSave?: (newConf: string) => void;
};

function VisualizationViewer({ visualizationType, ...props }: VisualizationViewerProps) {
  switch( visualizationType.toLowerCase() ) {
    case 'vitessce':
      return null;
    default:
      return <GoslingViewer {...props} />
  }
}

export default VisualizationViewer;
