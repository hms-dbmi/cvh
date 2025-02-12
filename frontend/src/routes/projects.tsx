import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";

import useProjects from "../features/projects/api/useProjects";
import ProjectCard from "../features/projects/components/ProjectCard";

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isLoading, isError, data } = useProjects();
  if (isLoading || isError) {
    return null;
  }
  return (
    <Stack>
      {data?.map((project) => (
        <ProjectCard project={project} key={project.uuid} />
      ))}
    </Stack>
  );
}
