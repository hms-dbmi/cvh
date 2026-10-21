import { Auth0Context, type Auth0ContextInterface } from "@auth0/auth0-react";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockAuth0Context } from "../test/auth-mock";

// The client module reads `fetch` and `VITE_API_URL` when it loads, so stub
// both first and import it fresh in each test. CI has no `.env`, and a
// relative URL can't be fetched outside a browser.
const fetchMock = vi.fn(
  async (_request: Request) =>
    new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
);

async function renderClient(auth: Partial<Auth0ContextInterface>) {
  const { default: useClient } = await import("./client.ts");
  const value = { ...mockAuth0Context, ...auth };
  const wrapper = ({ children }: PropsWithChildren) => (
    <Auth0Context.Provider value={value}>{children}</Auth0Context.Provider>
  );
  return renderHook(() => useClient(), { wrapper });
}

async function sendRequest(client: Awaited<ReturnType<typeof renderClient>>) {
  const { queryKey, queryFn } = client.result.current.queryOptions(
    "get",
    "/api/user",
  );
  await queryFn({
    queryKey,
    signal: new AbortController().signal,
    meta: undefined,
  } as never);
  const calls = fetchMock.mock.calls;
  return calls[calls.length - 1][0];
}

describe("useClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_API_URL", "https://api.cvh.test");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    fetchMock.mockClear();
  });

  it("looks the token up once per request, however often hooks re-render", async () => {
    const getAccessTokenSilently = vi.fn(async () => "token-123");
    const client = await renderClient({
      getAccessTokenSilently,
    } as unknown as Partial<Auth0ContextInterface>);
    for (let i = 0; i < 5; i++) client.rerender();

    const request = await sendRequest(client);

    expect(getAccessTokenSilently).toHaveBeenCalledTimes(1);
    expect(request.headers.get("Authorization")).toBe("Bearer token-123");
    expect(request.headers.get("X-CVH-Client")).toBe("web");
  });

  it("sends no Authorization header when signed out", async () => {
    const client = await renderClient({ isAuthenticated: false });

    const request = await sendRequest(client);

    expect(request.headers.get("Authorization")).toBeNull();
  });
});
