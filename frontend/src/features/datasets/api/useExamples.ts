import useClient, { buildInvalidateGetQuery } from "../../../api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";

const path = "/api/datasets";

const invalidateGetQuery = buildInvalidateGetQuery([
  path,
  "/api/projects",
  "/api/tags",
  "/api/visualizations",
]);

function useAddExample() {
  const { toastSuccess, toastError } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", "/api/examples", {
    onSuccess: () => {
      toastSuccess("Successfully added examples.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to add examples.");
    },
  });
}

export { useAddExample };
