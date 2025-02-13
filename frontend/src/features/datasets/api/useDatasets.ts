import useClient from "../../../api/client";
import { useQueryClient } from "@tanstack/react-query";

const path = "/api/datasets";

function useGetUserDatasets() {
  const client = useClient();
  return client.useQuery("get", path);
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
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["get", path] });
      console.log(data, variables, context);
    },
  });
}

export { useGetUserDatasets, useGetProjectDatasets, useCreateDataset };
