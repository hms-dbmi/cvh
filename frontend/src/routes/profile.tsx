import { createFileRoute } from "@tanstack/react-router";
import { useAuth0, GenericError } from "@auth0/auth0-react";
import { useEffect } from "react";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

const authParams = {
  authorizationParams: {
    audience: import.meta.env.VITE_API_AUDIENCE,
    scope: "read:current_user",
  },
};

function Profile() {
  const {
    user,
    isAuthenticated,
    isLoading,
    getAccessTokenWithPopup,
    getAccessTokenSilently,
    loginWithRedirect,
  } = useAuth0();

  useEffect(() => {
    async function f() {
      try {
        const token = await getAccessTokenSilently(authParams);
        console.log(token);
      } catch (e) {
        if (e instanceof GenericError) {
          if (e.error === "consent_required") {
            const popup = window.open("");
            const token = await getAccessTokenWithPopup(authParams, { popup });
            console.log(token);
          } else {
            throw e;
          }
        }
      }
    }
    f();
  }, [getAccessTokenSilently, getAccessTokenWithPopup, loginWithRedirect]);

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    isAuthenticated &&
    user && (
      <div>
        <img src={user.picture} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
    )
  );
}
