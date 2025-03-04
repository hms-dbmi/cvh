import useClient, { QueryOptions, buildInvalidateGetQuery } from "../../../api/client";
import { useQueryClient } from "@tanstack/react-query";

const path = "/api/datasets";

const invalidateGetQuery = buildInvalidateGetQuery([path, "/api/tags"])

function useGetUserDatasets(options?: QueryOptions) {
  const client = useClient();
  return client.useQuery("get", path, options);
}

function useGetProjectDatasets(projectId: string, tags: { tag: string }[]) {
  const queryOptions = tags.length
    ? {
        query: { tags: tags.map((t) => t.tag) },
      }
    : {};
  const client = useClient();
  return client.useQuery("get", `${path}/{project_uuid}`, {
    params: {
      path: { project_uuid: projectId },
      ...queryOptions,
    },
  });
}

function useCreateDataset() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", path, {
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
  });
}

function useUpdateDataset() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", path, {
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: invalidateGetQuery }),
  });
}

function useTagDataset() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", `${path}/tags`, {
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: invalidateGetQuery }),
  });
}

export {
  useGetUserDatasets,
  useGetProjectDatasets,
  useCreateDataset,
  useUpdateDataset,
  useTagDataset,
};
