import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/project/vitessce/{-$projectId}")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/project/{-$projectId}",
      params: { projectId: params.projectId },
    });
  },
  component: () => null,
});
