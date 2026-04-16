import { useQueryClient } from "@tanstack/react-query";
import useClient, {
  buildInvalidateGetQuery,
  type QueryOptions,
} from "../../../api/client";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";

/*
function useProjects() {
    const url: string = `${import.meta.env.VITE_API_URL}/api/workspaces`

    const fetcher = useFetcherWithToken();

    const result = useQuery({
      queryKey: [url],
      queryFn: ({queryKey}) => fetcher({url: queryKey[0]}),
    })

    return result;

  }
*/

const path = "/api/workspaces";
const publicPath = "/api/public/workspaces";
const membersPath = "/api/workspaces/{workspace_uuid}/members";

const invalidateGetQuery = buildInvalidateGetQuery([
  path,
  publicPath,
  membersPath,
]);

function useGetProjects(options?: QueryOptions) {
  const client = useClient();
  return client.useQuery("get", path, options);
}

function useGetPublicProjects(options?: QueryOptions) {
  const client = useClient();
  return client.useQuery("get", publicPath, options);
}

function useCreateProject() {
  const queryClient = useQueryClient();
  const { toastError, toastSuccess } = useSnackbarActions();

  const client = useClient();
  return client.useMutation("post", path, {
    onSuccess: () => {
      toastSuccess("Successfully created workspace.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to create workspace.");
    },
  });
}

function useGetProject(projectId: string) {
  const client = useClient();
  return client.useQuery("get", "/api/workspaces/{workspace_uuid}", {
    params: {
      path: { workspace_uuid: projectId },
    },
  });
}

function useAddProjectMember() {
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", membersPath, {
    onSuccess: () => {
      toastSuccess("Successfully shared workspace.");

      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to share workspace.");
    },
  });
}

function useUpdateProjectMember() {
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", membersPath, {
    onSuccess: () => {
      toastSuccess("Updated permissions.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to update permissions.");
    },
  });
}

function useRemoveProjectMember() {
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("delete", membersPath, {
    onSuccess: () => {
      toastSuccess("Removed workspace member.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to remove workspace member.");
    },
  });
}

function useDeleteProject() {
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("delete", "/api/workspaces/{workspace_uuid}", {
    onSuccess: () => {
      toastSuccess("Deleted workspace.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to delete workspace.");
    },
  });
}

function useUpdateProject() {
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", "/api/workspaces/{workspace_uuid}", {
    onSuccess: () => {
      toastSuccess("Updated workspace.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to update workspace.");
    },
  });
}

function useGetProjectMembers(projectId: string) {
  const client = useClient();
  return client.useQuery("get", membersPath, {
    params: {
      path: { workspace_uuid: projectId },
    },
  });
}

export {
  useAddProjectMember,
  useCreateProject,
  useDeleteProject,
  useGetProject,
  useGetProjectMembers,
  useGetPublicProjects,
  useRemoveProjectMember,
  useUpdateProject,
  useUpdateProjectMember,
};
export default useGetProjects;
