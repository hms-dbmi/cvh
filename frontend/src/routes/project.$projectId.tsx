import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useGetProject } from "../features/projects/api/useProjects";
import { useGetPaginatedProjectDatasets } from "../features/datasets/api/useDatasets";
import { useGetProjectVisualizations } from "../features/visualizations/api/useVisualizations";

import VisualizationViewer from "../features/visualizations/components/VisualizationViewer";
import { components } from "../types/schema";

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
});

type Dataset = components["schemas"]["DatasetOut"];

function RouteComponent() {
  const { projectId } = Route.useParams();

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
    />
  );
}
