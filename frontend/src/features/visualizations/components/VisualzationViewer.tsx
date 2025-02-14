import { GoslingComponent } from "gosling.js";

import { useGetVisualization } from "../api/useVisualizations.ts";

type Props = {
  visualizationId: string;
};

function VisualzationViewer({ visualizationId }: Props) {
  const { isLoading, isError, data } = useGetVisualization(visualizationId);

  if (isLoading || isError || !data) {
    return null;
  }

  return (
    <div>
      <GoslingComponent
        spec={data.conf}
        id={"my-gosling-component-id"}
        experimental={{ reactive: true }}
      />
    </div>
  );
}

export default VisualzationViewer;
