import { PropsWithChildren } from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import CssBaseline from "@mui/material/CssBaseline";

function Provider({ children }: PropsWithChildren) {
  return (
    <>
      <CssBaseline />
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENTID}
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
      >
        {children}
      </Auth0Provider>
    </>
  );
}

export default Provider;
