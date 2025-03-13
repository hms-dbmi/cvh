import { useQueryClient } from "@tanstack/react-query";
import useClient, {QueryOptions} from "../../../api/client";

const path = "/api/visualizations";

function useGetProjectVisualizations(projectId: string) {
  const client = useClient();
  return client.useQuery("get", path, {
    params: {
      query: { project_uuid: projectId },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", path] });
    },
  });
}

function useUpdateVisualization() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", `${path}/{visualization_uuid}`, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", path] });
    },
  });
}

function useDeleteVisualization() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("delete", `${path}/{visualization_uuid}`, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", path] });
    },
  });
}

function useGetPublishedVisualizations(options?: QueryOptions) {
  const client = useClient();
  return client.useQuery("get", "/api/public/visualizations", options);
}

export {
  useGetProjectVisualizations,
  useGetVisualization,
  useCreateVisualization,
  useUpdateVisualization,
  useDeleteVisualization,
  useGetPublishedVisualizations,
};
