import { createFileRoute, useRouter } from "@tanstack/react-router";
import useGetProjects, {
  useGetProject,
} from "../features/projects/api/useProjects";
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
  const {
    isLoading: isLoadingProject,
    isError: isErrorProject,
    data: project,
  } = useGetProject(projectId);

  const isLoading = isLoadingProject;

  const isError = isErrorProject;

  if (isLoading || isError || !project) {
    return null;
  }

  return (
    <VisualizationViewer
      projectId={projectId}
      visualizationType="gosling"
      permissions={project?.permissions ?? 0}
    />
  );
}
