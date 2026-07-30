import { Auth0Provider } from "@auth0/auth0-react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { router } from "./router";
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
      // Fires exactly once, right after Auth0 hands the user back
      // post-login. Send them to the app entry point instead of the
      // marketing landing page. Doesn't fire on subsequent visits to
      // `/`, so the landing page stays reachable to logged-in users.
      onRedirectCallback={() => {
        router.navigate({
          to: "/project/{-$projectId}",
          replace: true,
        });
      }}
      // Only persist tokens to localStorage during local dev — the Vite
      // dev server's full reloads (and any manual refresh) otherwise
      // wipe Auth0's in-memory cache and the user appears logged out on
      // every navigation. In prod we keep the SDK's default in-memory
      // cache for the stronger XSS posture.
      cacheLocation={import.meta.env.DEV ? "localstorage" : "memory"}
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
