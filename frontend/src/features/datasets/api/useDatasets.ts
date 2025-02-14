import useClient, { QueryOptions } from "../../../api/client";
import { useQueryClient} from "@tanstack/react-query";

const path = "/api/datasets";

function useGetUserDatasets(options?: QueryOptions) {
  const client = useClient();
  return client.useQuery("get", path, options);
}

function useGetProjectDatasets(projectId: string) {
  const client = useClient();
  return client.useQuery("get", `${path}/{project_uuid}`, {
    params: {
      path: { project_uuid: projectId },
    },
  });
}

function useCreateDataset() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", path, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", path] });
    },
  });
}

export { useGetUserDatasets, useGetProjectDatasets, useCreateDataset };
