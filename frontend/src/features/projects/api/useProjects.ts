import { useQuery } from "@tanstack/react-query"
import { useFetcherWithToken } from "../../../api/fetcher"

function useProjects() {
    const url: string = `${import.meta.env.VITE_API_URL}/api/projects`

    const fetcher = useFetcherWithToken();

    const result = useQuery({
      queryKey: [url],
      queryFn: ({queryKey}) => fetcher({url: queryKey[0]}),
    })

    return result;

  }

export default useProjects;