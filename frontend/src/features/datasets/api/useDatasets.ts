import { useQueryClient } from "@tanstack/react-query";
import useClient, {
  buildInvalidateGetQuery,
  type QueryOptions,
} from "../../../api/client";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";

const path = "/api/datasets";
const workspacePath = "/api/workspaces/{workspace_uuid}/datasets";

const invalidateGetQuery = buildInvalidateGetQuery([
  path,
  "/api/workspaces",
  "/api/tags",
]);

function useGetUserDatasets(options?: QueryOptions) {
  const client = useClient();
  return client.useQuery("get", path, options);
}

interface Tag {
  tag: string;
}

function formatTagsForQuery(tags: Tag[]) {
  return tags.map((tag) => tag.tag);
}

function useGetProjectDatasets(projectId: string, tags: Tag[]) {
  const queryOptions = tags.length
    ? {
        query: { tags: formatTagsForQuery(tags) },
      }
    : {};
  const client = useClient();
  return client.useQuery("get", workspacePath, {
    params: {
      path: { workspace_uuid: projectId },
      ...queryOptions,
    },
  });
}

interface Page {
  count: number;
  items: Record<string, unknown>[];
}

function getNextPageParam(lastPage: Page, pages: Page[]) {
  const allItems = pages.flatMap((page) => page.items);
  if (lastPage.count <= allItems.length) {
    return undefined;
  }
  const pageLength = lastPage.items.length;
  const nextPageNumber = Math.floor(allItems.length / pageLength) + 1;
  return nextPageNumber;
}

function hasFilter(filter: Record<string, unknown>) {
  return Object.keys(filter).length > 0;
}
/**
 * Fetches paginated datasets for a specific project, optionally filtered by tags.
 *
 * @param {string} projectId - The ID of the project to fetch datasets for.
 * @param {Tag[]} tags - An array of tags to filter the datasets.
 * @returns {object} - A React Query infinite query hook for paginated datasets.
 */
function useGetPaginatedProjectDatasets({
  projectId,
  tags = [],
  assemblies,
  fileTypes,
  name,
}: {
  projectId: string;
  tags?: string[];
  fileTypes?: string[];
  assemblies?: string[];
  name?: string;
}) {
  const tagsFilter = tags.length ? { tags } : {};
  const fileTypeFilter = fileTypes ? { file_type: fileTypes } : {};
  const assemblyFilter = assemblies ? { assembly: assemblies } : {};
  const nameFilter = name ? { name } : {};

  const queryOptions =
    hasFilter(tagsFilter) ||
    hasFilter(fileTypeFilter) ||
    hasFilter(assemblyFilter) ||
    hasFilter(nameFilter)
      ? {
          query: {
            ...tagsFilter,
            ...fileTypeFilter,
            ...assemblyFilter,
            ...nameFilter,
          },
        }
      : {};

  const client = useClient();
  return client.useInfiniteQuery(
    "get",
    workspacePath,
    {
      params: {
        path: { workspace_uuid: projectId },
        ...queryOptions,
      },
    },
    {
      pageParamName: "page",
      initialPageParam: 1,
      getNextPageParam: getNextPageParam,
    },
  );
}

function useCreateDataset() {
  const { toastSuccess, toastError } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", path, {
    onSuccess: () => {
      toastSuccess("Successfully created dataset.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to create dataset.");
    },
  });
}

function useUpdateDataset() {
  const { toastSuccess, toastError } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", `${path}/{dataset_uuid}`, {
    onSuccess: () => {
      toastSuccess("Successfully updated dataset.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to update dataset.");
    },
  });
}

function useGetDataset(datasetId: string) {
  const client = useClient();

  return client.useQuery("get", `${path}/{dataset_uuid}`, {
    params: {
      path: { dataset_uuid: datasetId },
    },
  });
}

function useDeleteDataset() {
  const { toastSuccess, toastError } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("delete", `${path}/{dataset_uuid}`, {
    onSuccess: () => {
      toastSuccess("Successfully removed data source.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to removed data source.");
    },
  });
}

function useTagDataset() {
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", `${path}/{dataset_uuid}/tags`, {
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: invalidateGetQuery }),
  });
}

function useGetProjectDatasetFieldValues(
  workspace_uuid: string,
  field: "assembly" | "file_type",
) {
  const client = useClient();

  return client.useQuery("get", `${workspacePath}/fields`, {
    params: {
      path: { workspace_uuid },
      query: { field },
    },
  });
}

function useGetProjectDatasetTags(workspace_uuid: string) {
  const client = useClient();

  return client.useQuery("get", `${workspacePath}/tags`, {
    params: {
      path: { workspace_uuid },
    },
  });
}

export {
  useGetUserDatasets,
  useGetProjectDatasets,
  useGetPaginatedProjectDatasets,
  useCreateDataset,
  useUpdateDataset,
  useTagDataset,
  useGetDataset,
  useDeleteDataset,
  useGetProjectDatasetFieldValues,
  useGetProjectDatasetTags,
};
