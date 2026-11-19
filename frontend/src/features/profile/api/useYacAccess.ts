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

const usageKey = ["yac-usage"];

// Silent token renewal runs in a hidden iframe, which browsers that block
// third-party cookies (Safari, Brave) refuse with login_required. Those
// people sign in to YAC once in a popup instead (useYacSignIn).
const SIGN_IN_ERRORS = [
  "login_required",
  "consent_required",
  "interaction_required",
];

export class YacSignInRequired extends Error {}

const tokenKey = ["yac-token"];

function useGetYacToken() {
  const { getAccessTokenSilently } = useAuth0();
  return async () => {
    try {
      return await getAccessTokenSilently({
        authorizationParams: { audience: YAC_AUDIENCE },
      });
    } catch (e) {
      const code = (e as { error?: string }).error;
      if (code && SIGN_IN_ERRORS.includes(code)) {
        throw new YacSignInRequired(code);
      }
      throw e;
    }
  };
}

// The YAC token for components that call YAC themselves (Explore's chat).
// Auth0 serves it from cache and renews it in the last 60 seconds before
// expiry, so asking more often than that never hands over an expired one.
function useYacToken(enabled: boolean) {
  const getToken = useGetYacToken();
  return useQuery({
    queryKey: tokenKey,
    enabled: enabled && yacConfigured,
    retry: false,
    refetchInterval: 30 * 1000,
    queryFn: getToken,
  });
}

// This month's AI spending, from the YAC service with a YAC token (only
// people with access can get one). Off until the YAC settings are set.
function useYacUsage(enabled: boolean) {
  const getToken = useGetYacToken();
  return useQuery({
    queryKey: usageKey,
    enabled: enabled && yacConfigured,
    // A 403 or a sign-in error won't heal on retry.
    retry: false,
    queryFn: async (): Promise<YacUsage> => {
      const token = await getToken();
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

// Gets the YAC token in a popup, then loads usage with it from the cache.
// Call it from a click so the browser allows the popup.
function useYacSignIn() {
  const { getAccessTokenWithPopup } = useAuth0();
  const queryClient = useQueryClient();
  return async () => {
    try {
      await getAccessTokenWithPopup({
        authorizationParams: { audience: YAC_AUDIENCE },
      });
    } catch {
      return; // Closed or blocked popup: keep the sign-in prompt.
    }
    queryClient.invalidateQueries({ queryKey: usageKey });
    queryClient.invalidateQueries({ queryKey: tokenKey });
  };
}

export {
  useGetYacAccess,
  useRequestYacAccess,
  useYacSignIn,
  useYacToken,
  useYacUsage,
  YAC_URL,
  yacConfigured,
};
