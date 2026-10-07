import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/project/vitessce/{-$projectId}")({
  // The workspace is an app surface, not a page.
  staticData: { fullBleed: true, hideFooter: true },
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/project/{-$projectId}",
      params: { projectId: params.projectId },
    });
  },
  component: () => null,
});
