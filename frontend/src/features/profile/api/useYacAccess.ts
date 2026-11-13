import { useAuth0 } from "@auth0/auth0-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useClient, { buildInvalidateGetQuery } from "@/api/client";
import { useSnackbarActions } from "@/components/Snackbar/useSnackbarStore";
import { hasErrorCode } from "@/features/projects/api/useProjects";

const path = "/api/yac/access";

const invalidateGetQuery = buildInvalidateGetQuery([path]);

function useGetYacAccess() {
  const client = useClient();
  return client.useQuery("get", path);
}

function useRequestYacAccess() {
  const { toastError, toastSuccess } = useSnackbarActions();
  const queryClient = useQueryClient();
  const client = useClient();
  return client.useMutation("post", path, {
    onSuccess: () => {
      toastSuccess("Access request sent.");
      queryClient.invalidateQueries({ predicate: invalidateGetQuery });
    },
    onError: (error) => {
      // Already asked (another tab, say): show the request we have.
      if (hasErrorCode(error, "already_requested")) {
        queryClient.invalidateQueries({ predicate: invalidateGetQuery });
        return;
      }
      toastError("Failed to request access.");
    },
  });
}

export type YacUsage = {
  spent_usd: number;
  limit_usd: number;
  percent_used: number;
  renews_on: string;
};

const YAC_URL: string | undefined = import.meta.env.VITE_YAC_URL;
const YAC_AUDIENCE: string | undefined = import.meta.env.VITE_YAC_AUDIENCE;
// No YAC in this environment yet: the profile hides AI usage entirely.
const yacConfigured = Boolean(YAC_URL && YAC_AUDIENCE);

// This month's AI spending, from the YAC service with a YAC token (only
// people with access can get one). Off until the YAC settings are set.
function useYacUsage(enabled: boolean) {
  const { getAccessTokenSilently } = useAuth0();
  return useQuery({
    queryKey: ["yac-usage"],
    enabled: enabled && yacConfigured,
    queryFn: async (): Promise<YacUsage> => {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: YAC_AUDIENCE },
      });
      const response = await fetch(`${YAC_URL}/v1/yac/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`YAC usage request failed: ${response.status}`);
      }
      return response.json();
    },
  });
}

export { useGetYacAccess, useRequestYacAccess, useYacUsage, yacConfigured };
