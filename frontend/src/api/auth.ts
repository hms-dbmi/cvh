import { GenericError, useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";

const authParams = {
	authorizationParams: {
		audience: import.meta.env.VITE_API_AUDIENCE,
		scope: "read:current_user",
	},
};

function useAuthToken() {
	const { getAccessTokenWithPopup, getAccessTokenSilently } = useAuth0();

	return useCallback(async () => {
		try {
			const token = await getAccessTokenSilently(authParams);
			return token;
		} catch (e) {
			if (e instanceof GenericError) {
				if (e.error === "consent_required" || e.error === "login_required") {
					const popup = window.open("");
					const token = await getAccessTokenWithPopup(authParams, { popup });
					return token;
				}
				throw e;
			}
		}
	}, [getAccessTokenSilently, getAccessTokenWithPopup]);
}

export { useAuthToken };
