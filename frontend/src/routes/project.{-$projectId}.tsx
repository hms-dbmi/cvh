import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { useGetProject } from "../features/projects/api/useProjects";
import { useGetProjectVisualizations } from "../features/visualizations/api/useVisualizations";
import useGetProjects from "../features/projects/api/useProjects";
import VisualizationViewer from "../features/visualizations/components/VisualizationViewer";

export const Route = createFileRoute("/project/{-$projectId}")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { data: projectsData } = useGetProjects();
  const router = useRouter();

  if (projectId) {
    return <ProjectsPage projectId={projectId} />;
  }

  const firstProjectID = projectsData?.items?.[0].uuid;

  if (firstProjectID) {
    router.navigate({
      to: "/project/{-$projectId}",
      params: { projectId: firstProjectID },
    });
  }

  return null;
}

function ProjectsPage({ projectId }: { projectId: string }) {
  const [selectedTags] = useState<{ tag: string }[]>([]);

  const { isLoading: isLoadingProject, isError: isErrorProject } =
    useGetProject(projectId);

  const { isLoading: isLoadingVisualizations, isError: isErrorVisualizations } =
    useGetProjectVisualizations({ projectId, tags: selectedTags });

  const isLoading = isLoadingProject || isLoadingVisualizations;

  const isError = isErrorProject || isErrorVisualizations;

  if (isLoading || isError) {
    return null;
  }

  return (
    <VisualizationViewer projectId={projectId} visualizationType="gosling" />
  );
}
