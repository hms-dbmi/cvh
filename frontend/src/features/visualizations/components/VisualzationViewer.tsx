import { Frame } from "@hms-dbmi/gosling-designer-cvh";
import "@hms-dbmi/gosling-designer-cvh/build/style.css";

import { useGetVisualization } from "../api/useVisualizations.ts";

type Props = {
  visualizationId: string;
};

function VisualzationViewer({ visualizationId }: Props) {
  const { isLoading, isError, data } = useGetVisualization(visualizationId);

  if (isLoading || isError || !data?.conf) {
    return null;
  }

  return (
    <div>
      <Frame initialSpec={data.conf} initialTrackToDatasetMap={{}} />
    </div>
  );
}

export default VisualzationViewer;
