import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import ProjectCard from "../features/projects/components/ProjectCard";
import AddProjectButton from "../features/projects/components/AddProjectButton";
import useGetProjects from "../features/projects/api/useProjects";
import { useGetUserDatasets } from "../features/datasets/api/useDatasets";
import AddDatasetButton from "../features/datasets/components/AddDatasetButton";

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isLoading, isError, data } = useGetProjects();
  const { isLoading: l, isError: e, data: d } = useGetUserDatasets();

  if (isLoading || isError || l || e) {
    return null;
  }

  return (
    <Stack direction="row" spacing={4}>
      <Box>
        <AddProjectButton />
        <Stack spacing={2}>
          {data?.map((project) => (
            <ProjectCard project={project} key={project.uuid} />
          ))}
        </Stack>
      </Box>
      <Box>
        <Stack spacing={2}>
          <AddDatasetButton />
          {d?.map((dataset) => <div key={dataset.uuid}>{dataset.uuid}</div>)}
        </Stack>
      </Box>
    </Stack>
  );
}
