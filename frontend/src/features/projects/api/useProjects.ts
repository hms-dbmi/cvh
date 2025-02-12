import useClient from "../../../api/client";

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
  
function useProjects(){
  const client = useClient();
  return client.useQuery("get", "/api/projects");
}

export default useProjects;