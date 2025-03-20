import useClient, { QueryOptions, buildInvalidateGetQuery } from "../../../api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";

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
  const {toastSuccess, toastError} = useSnackbarActions()
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", path, {
    onSuccess: () =>{
      toastSuccess("Successfully created dataset.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to create dataset.");
    }
  });
}

function useUpdateDataset() {
  const {toastSuccess, toastError} = useSnackbarActions()
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", path, {
    onSuccess: () =>{
      toastSuccess("Successfully updated dataset.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to update dataset.");
    }
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
