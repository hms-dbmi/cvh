import useClient from "../../../api/client";

const path = "/api/tags";

function useGetTags(tagStr?: string) {
  const client = useClient();

  const options = tagStr
    ? {
        params: {
          query: { sub_str: tagStr },
        },
      }
    : {};
  return client.useQuery("get", path, options);
}

export { useGetTags };
