import { Auth0Provider } from "@auth0/auth0-react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { MockAuth0Provider } from "./test/auth-mock";
import theme from "./theme";

const queryClient = new QueryClient();

const isE2E = import.meta.env.VITE_E2E === "true";

function AuthProvider({ children }: PropsWithChildren) {
  if (isE2E) {
    return <MockAuth0Provider>{children}</MockAuth0Provider>;
  }
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENTID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_API_AUDIENCE,
        scope: "read:current_user email",
      }}
    >
      {children}
    </Auth0Provider>
  );
}

function Provider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default Provider;
