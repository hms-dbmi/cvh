import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";

import ProjectCard from "../features/projects/components/ProjectCard";
import AddProjectButton from "../features/projects/components/AddProjectButton";
import useGetProjects from "../features/projects/api/useProjects";

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isLoading, isError, data } = useGetProjects();
  if (isLoading || isError) {
    return null;
  }
  return (
    <div>
      <AddProjectButton />
      <Stack spacing={2}>
        {data?.map((project) => (
          <ProjectCard project={project} key={project.uuid} />
        ))}
      </Stack>
    </div>
  );
}
