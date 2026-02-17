import { useCallback } from "react";

import { useAuthToken } from "./auth";

interface FetchOptions {
  url: string;
  requestInit?: RequestInit;
  expectedStatusCodes?: number[];
  errorMessages?: Record<number, string>;
  returnResponse?: boolean;
}

async function fetcher({
  url,
  requestInit = {},
  expectedStatusCodes = [200],
  errorMessages = {},
  returnResponse = false,
}: FetchOptions): Promise<unknown> {
  return fetch(url, requestInit).then(async (response) => {
    if (!expectedStatusCodes.includes(response.status)) {
      const rawText = await response.text();
      let errorBody: Record<string, unknown> = { error: rawText };
      try {
        errorBody = JSON.parse(rawText) as Record<string, unknown>;
        console.error(errorBody);
      } catch {
        // Ignore and use the raw text instead since error was not returned as json
      }
      const message =
        errorMessages[response.status] ?? `The request to ${url} failed.`;
      const error = new Error(message);
      throw error;
    }
    if (returnResponse) {
      return response;
    }
    return response.json() as Promise<unknown>;
  });
}

function useFetcherWithToken() {
  const getToken = useAuthToken();

  return useCallback(
    async ({ requestInit = {}, ...rest }: FetchOptions) => {
      const token = await getToken();
      const authHeader = { Authorization: `Bearer ${token}` };

      const { headers = {} } = requestInit;

      const requestInitWithAuthHeaders: RequestInit = {
        ...requestInit,
        headers: { ...headers, ...authHeader },
      };

      return fetcher({ ...rest, requestInit: requestInitWithAuthHeaders });
    },
    [getToken],
  );
}

export { useFetcherWithToken };
export type { FetchOptions };
export default fetcher;
