import { createFileRoute } from "@tanstack/react-router";
import { useGetProject } from "../features/projects/api/useProjects";
import ProjectCard from "../features/projects/components/ProjectCard";

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { isLoading, isError, data } = useGetProject(projectId);

  if (isLoading || isError || !data) {
    return null;
  }
  return <ProjectCard project={data} />;
}
