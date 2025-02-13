import useClient from "../../../api/client";
import { useQueryClient } from '@tanstack/react-query'

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

const path = "/api/projects"
  
function useGetProjects(){
  const client = useClient();
  return client.useQuery("get", path);
}

function useCreateProject(){
  const queryClient = useQueryClient()
  const client = useClient();
  return client.useMutation("post", path, {onSuccess: () => queryClient.invalidateQueries({queryKey:["get", path]})});
}

function useGetProject(projectId: string){
  const client = useClient();
  return client.useQuery("get", "/api/projects/{project_uuid}",{
    params: {
      path: { project_uuid: projectId },
    },
  });
}

export {useCreateProject, useGetProject}
export default useGetProjects;