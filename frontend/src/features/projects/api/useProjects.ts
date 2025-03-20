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
const membersPath = "/api/projects/members/{project_uuid}";

const invalidateGetQuery = buildInvalidateGetQuery([path, publicPath, membersPath])


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
    onSuccess: () =>{
      toastSuccess("Successfully created project.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to create project.");
    }
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
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", "/api/projects/members", {
    onSuccess: () =>{
      toastSuccess("Successfully shared project.");

      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to share project.");
    }

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

function useRemoveProjectMember() {
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("delete", "/api/projects/members", {
    onSuccess: () =>{
      toastSuccess('Removed project member.');
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to remove project member.")
    }

  });
}

function useDeleteProject() {
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("delete", "/api/projects/{project_uuid}", {
    onSuccess: () =>{
      toastSuccess('Deleted project.');
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to delete project.")
    }

  });
}



function useGetProjectMembers(projectId: string) {
  const client = useClient();
  return client.useQuery("get", membersPath, {
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
  useRemoveProjectMember,
  useDeleteProject
};
export default useGetProjects;
