import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import { useGetProject } from "../features/projects/api/useProjects";
import ProjectCard from "../features/projects/components/ProjectCard";
import AddDatasetButton from "../features/datasets/components/AddDatasetButton";
import { useGetProjectDatasets } from "../features/datasets/api/useDatasets";

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { isLoading, isError, data } = useGetProject(projectId);
  const {
    isLoading: l,
    isError: e,
    data: d,
  } = useGetProjectDatasets(projectId);

  if (isLoading || isError || !data || l || e) {
    return null;
  }
  return (
    <Stack direction="row" spacing={4}>
      <ProjectCard project={data} />
      <Box>
        <Stack spacing={2}>
          <AddDatasetButton projectId={projectId} />
          {d?.map((dataset) => <div key={dataset.uuid}>{dataset.uuid}</div>)}
        </Stack>
      </Box>
    </Stack>
  );
}
