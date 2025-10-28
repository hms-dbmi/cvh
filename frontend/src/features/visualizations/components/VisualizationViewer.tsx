import "gosling-designer-vec/build/style.css";

import GoslingViewer from "./GoslingViewer.tsx";

interface VisualizationViewerProps {
  projectId: string;
  visualizationType: string;
  readonly?: boolean;
  onSave?: (newConf: string) => void;
}

function VisualizationViewer({
  visualizationType,
  ...props
}: VisualizationViewerProps) {
  switch (visualizationType.toLowerCase()) {
    case "vitessce":
      return null;
    default:
      return <GoslingViewer {...props} />;
  }
}

export default VisualizationViewer;
