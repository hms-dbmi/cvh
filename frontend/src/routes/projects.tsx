import { createFileRoute } from "@tanstack/react-router";

import ProjectsList from "../features/projects/components/ProjectsList";

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ProjectsList />;
}
