import { createFileRoute, useRouter } from "@tanstack/react-router";
import useGetProjects, {
  useGetProject,
} from "../features/projects/api/useProjects";
import VitessceViewer from "../features/visualizations/components/VitessceViewer";

export const Route = createFileRoute("/project/vitessce/{-$projectId}")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { data: projectsData } = useGetProjects();
  const router = useRouter();

  if (projectId) {
    return <VitesscePage projectId={projectId} />;
  }

  const firstProjectID = projectsData?.items?.[0].uuid;

  if (firstProjectID) {
    router.navigate({
      to: "/project/vitessce/{-$projectId}",
      params: { projectId: firstProjectID },
    });
  }

  return null;
}

function VitesscePage({ projectId }: { projectId: string }) {
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
    <VitessceViewer
      projectId={projectId}
      permissions={project?.permissions ?? 0}
    />
  );
}
