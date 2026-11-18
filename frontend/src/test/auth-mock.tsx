import { Auth0Context, type Auth0ContextInterface } from "@auth0/auth0-react";
import type { PropsWithChildren } from "react";

const mockUser = {
  sub: "auth0|e2e-test-user",
  email: "e2e@example.com",
  name: "E2E Test User",
  email_verified: true,
};

const noop = async () => {};

export const mockAuth0Context = {
  isAuthenticated: true,
  isLoading: false,
  user: mockUser,
  error: undefined,
  // `__e2eYacSignInRequired` makes silent sign-in to the YAC audience fail
  // the way a browser blocking third-party cookies does, until the popup.
  getAccessTokenSilently: async (options?: {
    authorizationParams?: { audience?: string };
  }) => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    const w = window as any;
    if (
      w.__e2eYacSignInRequired &&
      options?.authorizationParams?.audience ===
        import.meta.env.VITE_YAC_AUDIENCE
    ) {
      throw { error: "login_required" };
    }
    return "e2e-fake-token";
  },
  getAccessTokenWithPopup: async () => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eYacSignInRequired = false;
    return "e2e-fake-token";
  },
  getIdTokenClaims: async () => undefined,
  loginWithRedirect: noop,
  loginWithPopup: noop,
  logout: noop,
  handleRedirectCallback: async () => ({ appState: undefined }),
  // The full Auth0ContextInterface includes a number of methods our app
  // never calls (MFA, custom token exchange, etc.). Cast to skip stubbing
  // every one of them.
} as unknown as Auth0ContextInterface;

export function MockAuth0Provider({ children }: PropsWithChildren) {
  return (
    <Auth0Context.Provider value={mockAuth0Context}>
      {children}
    </Auth0Context.Provider>
  );
}
