import { GenericError, useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";

const authParams = {
  authorizationParams: {
    audience: import.meta.env.VITE_API_AUDIENCE,
    scope: "read:current_user email",
  },
};

function useAuthToken() {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  return useCallback(async () => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    try {
      const token = await getAccessTokenSilently(authParams);
      return token;
    } catch (e) {
      if (e instanceof GenericError) {
        console.error(e.error);
      }
    }
  }, [getAccessTokenSilently, isAuthenticated, isLoading]);
}

export { useAuthToken };
