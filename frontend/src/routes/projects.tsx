import { createFileRoute } from "@tanstack/react-router";
import useProjects from "../features/projects/api/useProjects";

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  const result = useProjects();
  console.log(result.data);
  return <div>Hello "/projects"!</div>;
}
