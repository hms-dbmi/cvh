import { createFileRoute } from "@tanstack/react-router";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useAuthToken } from "../api/auth";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth0();

  const getToken = useAuthToken();

  useEffect(() => {
    async function f() {
      const token = await getToken();
      console.log(token);
    }
    f();
  }, [getToken]);

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
