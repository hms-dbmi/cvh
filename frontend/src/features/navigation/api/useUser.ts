import { useQueryClient } from "@tanstack/react-query";
import useClient, { buildInvalidateGetQuery } from "../../../api/client";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";

const path = "/api/user";

const invalidateGetQuery = buildInvalidateGetQuery([path]);

function useGetUser() {
  const client = useClient();
  return client.useQuery("get", path);
}

function useUpdateUser() {
  const { toastSuccess, toastError } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("put", path, {
    onSuccess: () => {
      toastSuccess("Successfully updated profile.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: () => {
      toastError("Failed to update profile.");
    },
  });
}

export { useGetUser, useUpdateUser };
