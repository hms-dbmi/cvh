import useClient, { QueryOptions } from "../../../api/client";
import { useQueryClient, Query} from "@tanstack/react-query";

const path = "/api/datasets";

function invalidateGetQuery(q: Query<unknown, Error, unknown, string[]>){
  const queryKey = q?.queryKey;

  if(queryKey[0] === "get" && (queryKey[1]?.startsWith("/api/datasets") || queryKey[1]?.startsWith("/api/tags"))){
    return true
  }
  return false;
}

function useGetUserDatasets(options?: QueryOptions) {
  const client = useClient();
  return client.useQuery("get", path, options);
}

function useGetProjectDatasets(projectId: string, tags: {tag: string}[]) {
  const queryOptions = tags.length ? {
      query: { tags: tags.map((t) => t.tag) },
  } : {}
  const client = useClient();
  return client.useQuery("get", `${path}/{project_uuid}`, {
    params: {
      path: { project_uuid: projectId },
      ...queryOptions,
    },
  });
}

function useScrollDatasets(projectId: string, tags: {tag: string}[]){
  const queryOptions = tags.length ? {
    query: { tags: tags.map((t) => t.tag) },
} : {}

const client = useClient();
return client.useInfiniteQuery("get", `${path}/{project_uuid}`, {
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
    onSuccess: () => queryClient.invalidateQueries({ predicate: invalidateGetQuery })

  });
}

function useTagDataset() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", `${path}/tags`, {
    onSuccess: () => queryClient.invalidateQueries({ predicate: invalidateGetQuery })
  });
}

export { useGetUserDatasets, useGetProjectDatasets, useCreateDataset, useUpdateDataset, useTagDataset };
