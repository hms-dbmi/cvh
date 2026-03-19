import { useQueryClient } from "@tanstack/react-query";
import useClient, {
  buildInvalidateGetQuery,
  type QueryOptions,
} from "../../../api/client";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";

const path = "/api/visualizations";
const publicPath = "/api/public/visualizations";

const invalidateGetQuery = buildInvalidateGetQuery([
  path,
  publicPath,
  "/api/workspaces",
  "/api/tags",
]);

function hasFilter(filter: Record<string, unknown>) {
  return Object.keys(filter).length > 0;
}

function useGetProjectVisualizations({
  tags = [],
  projectId,
  name,
}: {
  tags: string[];
  projectId: string;
  name?: string;
}) {
  const tagsFilter = tags.length ? { tags } : {};
  const nameFilter = name ? { name } : {};

  const queryOptions =
    hasFilter(tagsFilter) || hasFilter(nameFilter)
      ? { ...tagsFilter, ...nameFilter }
      : {};

  const client = useClient();
  return client.useQuery("get", path, {
    params: {
      query: {
        workspace_uuid: projectId,
        ...queryOptions,
      },
    },
  });
}

function useGetVisualization(visualizationId: string) {
  const client = useClient();

  return client.useQuery("get", `${path}/{visualization_uuid}`, {
    params: {
      path: { visualization_uuid: visualizationId },
    },
  });
}

function useGetPublishedVisualization(visualizationId: string) {
  const client = useClient();

  return client.useQuery("get", `${publicPath}/{visualization_uuid}`, {
    params: {
      path: { visualization_uuid: visualizationId },
    },
  });
}

function useCreateVisualization(setSelectedVizId?: (id: string) => void) {
  const { toastSuccess, toastError } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", path, {
    onSuccess: (data) => {
      toastSuccess("Successfully created visualization.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });

      const uuid = data?.uuid;

      if (uuid && setSelectedVizId) {
        setSelectedVizId(uuid);
      }
    },
    onError: () => {
      toastError("Failed to create visualization.");
    },
  });
}

function useUpdateVisualization() {
  const { toastSuccess, toastError } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", `${path}/{visualization_uuid}`, {
    onSuccess: () => {
      toastSuccess("Successfully updated visualization.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to update visualization.");
    },
  });
}

function useDeleteVisualization() {
  const { toastSuccess, toastError } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("delete", `${path}/{visualization_uuid}`, {
    onSuccess: () => {
      toastSuccess("Successfully deleted visualization.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to delete visualization.");
    },
  });
}

function useGetPublishedVisualizations({
  tags = [],
  options,
}: {
  tags?: { tag: string }[];
  options?: QueryOptions;
}) {
  const queryOptions = tags.length ? { tags: tags.map((t) => t.tag) } : {};
  const client = useClient();
  return client.useQuery("get", publicPath, {
    params: {
      query: {
        ...(options?.params?.query ?? {}),
        ...queryOptions,
      },
    },
  });
}

function useTagVisualization() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", `${path}/{visualization_uuid}/tags`, {
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: invalidateGetQuery }),
  });
}

function useGetProjectVisualizationTags(workspace_uuid: string) {
  const client = useClient();

  return client.useQuery("get", `${path}/tags`, {
    params: {
      query: { workspace_uuid },
    },
  });
}

export {
  useGetProjectVisualizations,
  useGetVisualization,
  useCreateVisualization,
  useUpdateVisualization,
  useDeleteVisualization,
  useGetPublishedVisualizations,
  useTagVisualization,
  useGetProjectVisualizationTags,
  useGetPublishedVisualization,
};
