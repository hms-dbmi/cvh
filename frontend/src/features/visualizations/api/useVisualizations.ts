import { useQueryClient } from "@tanstack/react-query";
import useClient, {
  QueryOptions,
  buildInvalidateGetQuery,
} from "../../../api/client";

const path = "/api/visualizations";
const publicPath = "/api/public/visualizations";

const invalidateGetQuery = buildInvalidateGetQuery([
  path,
  publicPath,
  "/api/tags",
]);

function useGetProjectVisualizations({
  tags,
  projectId,
}: {
  tags: { tag: string }[];
  projectId: string;
}) {
  const queryOptions = tags.length ? { tags: tags.map((t) => t.tag) } : {};
  const client = useClient();
  return client.useQuery("get", publicPath, {
    params: {
      query: {
        project_uuid: projectId,
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

function useCreateVisualization() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", path, {
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: invalidateGetQuery }),
  });
}

function useUpdateVisualization() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", `${path}/{visualization_uuid}`, {
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: invalidateGetQuery }),
  });
}

function useDeleteVisualization() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("delete", `${path}/{visualization_uuid}`, {
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: invalidateGetQuery }),
  });
}

function useGetPublishedVisualizations({
  tags,
  options,
}: {
  tags: { tag: string }[];
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

export {
  useGetProjectVisualizations,
  useGetVisualization,
  useCreateVisualization,
  useUpdateVisualization,
  useDeleteVisualization,
  useGetPublishedVisualizations,
  useTagVisualization,
};
