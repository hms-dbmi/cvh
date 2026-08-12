import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import useGetProjects, {
  useGetProject,
} from "../features/projects/api/useProjects";
import VisualizationViewer from "../features/visualizations/components/VisualizationViewer";
import posthog from "../posthog";

export const Route = createFileRoute("/project/{-$projectId}")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { data: projectsData } = useGetProjects();
  const router = useRouter();

  if (projectId) {
    return <ProjectsPage projectId={projectId} />;
  }

  const firstProjectID = projectsData?.items?.[0].uuid;

  if (firstProjectID) {
    router.navigate({
      to: "/project/{-$projectId}",
      params: { projectId: firstProjectID },
    });
  }

  return null;
}

function ProjectsPage({ projectId }: { projectId: string }) {
  const {
    isLoading: isLoadingProject,
    isError: isErrorProject,
    data: project,
  } = useGetProject(projectId);

  // Tag PostHog events with the current workspace so analytics can be
  // sliced per-workspace ("which workspaces publish most", "engagement
  // by workspace"). Overwrites the previous workspace context when the
  // user switches; resetting on unmount so events fired from non-
  // workspace routes (landing, tutorials) don't carry a stale tag.
  useEffect(() => {
    if (!project?.name) return;
    posthog.group("workspace", projectId, { name: project.name });
    return () => {
      posthog.resetGroups();
    };
  }, [projectId, project?.name]);

  const isLoading = isLoadingProject;

  const isError = isErrorProject;

  if (isLoading || isError || !project) {
    return null;
  }

  return (
    <VisualizationViewer
      projectId={projectId}
      permissions={project?.permissions ?? 0}
    />
  );
}
