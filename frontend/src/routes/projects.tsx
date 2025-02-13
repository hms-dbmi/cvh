import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";

import ProjectsList from "../features/projects/components/ProjectsList";
import DatasetsList from "../features/datasets/components/DatasetsList";

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Stack direction="row" spacing={4}>
      <ProjectsList />
      <DatasetsList />
    </Stack>
  );
}
