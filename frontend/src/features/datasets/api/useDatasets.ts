import { useQueryClient } from "@tanstack/react-query";
import useClient, {
	type QueryOptions,
	buildInvalidateGetQuery,
} from "../../../api/client";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";

const path = "/api/datasets";

const invalidateGetQuery = buildInvalidateGetQuery([
	path,
	"/api/projects",
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
	return client.useQuery("get", `${path}/{project_uuid}`, {
		params: {
			path: { project_uuid: projectId },
			...queryOptions,
		},
	});
}

/**
 * Fetches paginated datasets for a specific project, optionally filtered by tags.
 *
 * @param {string} projectId - The ID of the project to fetch datasets for.
 * @param {Tag[]} tags - An array of tags to filter the datasets.
 * @returns {object} - A React Query infinite query hook for paginated datasets.
 */
function useGetPaginatedProjectDatasets(projectId: string, tags: Tag[]) {
	const queryOptions = tags.length
		? {
				query: { tags: formatTagsForQuery(tags) },
			}
		: {};
	const client = useClient();
	return client.useInfiniteQuery(
		"get",
		`${path}/{project_uuid}`,
		{
			params: {
				path: { project_uuid: projectId },
				...queryOptions,
			},
		},
		{
			pageParamName: "page",
			initialPageParam: 1,
			getNextPageParam: (lastPage, pages) => {
				const allItems = pages.flatMap((page) => page.items);
				if (lastPage.count <= allItems.length) {
					return undefined;
				}
				const pageLength = lastPage.items.length;
				const nextPageNumber = Math.floor(allItems.length / pageLength) + 1;
				return nextPageNumber;
			},
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
	return client.useMutation("put", path, {
		onSuccess: () => {
			toastSuccess("Successfully updated dataset.");
			queryClient.invalidateQueries({ predicate: invalidateGetQuery });
		},
		onError: () => {
			toastError("Failed to update dataset.");
		},
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
	useGetPaginatedProjectDatasets,
	useCreateDataset,
	useUpdateDataset,
	useTagDataset,
};
