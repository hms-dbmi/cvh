import { useCallback } from "react";
import { useAuth0, GenericError } from "@auth0/auth0-react";


const authParams = {
    authorizationParams: {
      audience: import.meta.env.VITE_API_AUDIENCE,
      scope: "read:current_user",
    },
  };

function useAuthToken(){
    const {
        getAccessTokenWithPopup,
        getAccessTokenSilently,
      } = useAuth0();

      return useCallback(async () => {
          try {
            const token = await getAccessTokenSilently(authParams);
            return token;
          } catch (e) {
            if (e instanceof GenericError) {
              if (e.error === "consent_required") {
                const popup = window.open("");
                const token = await getAccessTokenWithPopup(authParams, { popup });
                return token;
              } else {
                throw e;
              }
            }
          }
      }, [getAccessTokenSilently, getAccessTokenWithPopup])
}

export {useAuthToken}
