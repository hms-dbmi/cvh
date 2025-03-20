import useClient, { QueryOptions, buildInvalidateGetQuery } from "../../../api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";
/*
function useProjects() {
    const url: string = `${import.meta.env.VITE_API_URL}/api/projects`

    const fetcher = useFetcherWithToken();

    const result = useQuery({
      queryKey: [url],
      queryFn: ({queryKey}) => fetcher({url: queryKey[0]}),
    })

    return result;

  }
*/

const path = "/api/projects";
const publicPath = "/api/public/projects";

const invalidateGetQuery = buildInvalidateGetQuery([path, publicPath])


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
  const client = useClient();
  return client.useMutation("post", path, {
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: invalidateGetQuery }),
  });
}

function useGetProject(projectId: string) {
  const client = useClient();
  return client.useQuery("get", "/api/projects/{project_uuid}", {
    params: {
      path: { project_uuid: projectId },
    },
  });
}

function useAddProjectMember() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", "/api/projects/members", {
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: invalidateGetQuery }),
  });
}

function useUpdateProjectMember() {
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", "/api/projects/members", {
    onSuccess: () =>{
      toastSuccess('Updated permissions.');
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to update permissions.")
    }

  });
}


function useGetProjectMembers(projectId: string) {
  const client = useClient();
  return client.useQuery("get", "/api/projects/members/{project_uuid}", {
    params: {
      path: { project_uuid: projectId },
    },
  });
}

export {
  useCreateProject,
  useGetProject,
  useGetPublicProjects,
  useAddProjectMember,
  useGetProjectMembers,
  useUpdateProjectMember,
};
export default useGetProjects;
