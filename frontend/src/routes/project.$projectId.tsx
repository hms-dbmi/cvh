import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useGetProject } from "../features/projects/api/useProjects";
import { useGetPaginatedProjectDatasets } from "../features/datasets/api/useDatasets";
import {
  useGetProjectVisualizations,
  useUpdateVisualization,
} from "../features/visualizations/api/useVisualizations";

import VisualizationViewer from "../features/visualizations/components/VisualizationViewer";
import { useSnackbarActions } from "../components/Snackbar/useSnackbarStore";
import { components } from "../types/schema";

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
});

type Visualization = components["schemas"]["VisualizationNoConfOut"];
type Dataset = components["schemas"]["DatasetOut"];

function RouteComponent() {
  const { projectId } = Route.useParams();

  const [selectedViz, setSelectedViz] = useState<Visualization>();
  const [isEditing, setIsEditing] = useState<boolean>();

  const [selectedTags] = useState<{ tag: string }[]>([]);

  const { isLoading: isLoadingProject, isError: isErrorProject } =
    useGetProject(projectId);
  const {
    isLoading: isLoadingDatasets,
    isError: isErrorDatasets,
    data: datasets,
  } = useGetPaginatedProjectDatasets(projectId, selectedTags);

  const allDatasets: Required<Dataset>[] =
    datasets?.pages.flatMap((page) => page.items as Required<Dataset>[]) ?? [];

  const { isLoading: isLoadingVisualizations, isError: isErrorVisualizations } =
    useGetProjectVisualizations({ projectId, tags: selectedTags });

  const { mutate: updateViz } = useUpdateVisualization();

  const { toastError } = useSnackbarActions();

  const onSave = useCallback(
    (uuid: string) => (newConf: string) => {
      setIsEditing(false);
      setSelectedViz(undefined);
      try {
        const conf = JSON.parse(newConf);
        updateViz({
          body: { conf },
          params: {
            path: { visualization_uuid: uuid },
          },
        });
      } catch (e) {
        toastError("Error saving visualization");
        console.error(e);
      }
    },
    [updateViz, toastError]
  );

  const isLoading =
    isLoadingProject || isLoadingDatasets || isLoadingVisualizations;

  const isError = isErrorProject || isErrorDatasets || isErrorVisualizations;

  if (isLoading || isError) {
    return null;
  }

  return (
    <VisualizationViewer
      projectId={projectId}
      visualizationType="gosling"
      datasets={allDatasets}
      onSave={isEditing ? onSave(selectedViz.uuid!) : undefined}
    />
  );
}
