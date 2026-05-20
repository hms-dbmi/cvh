import type { Page } from "@playwright/test";

export type RecordedRequest = {
  method: string;
  path: string;
  body: unknown;
};

declare global {
  interface Window {
    __e2eRequests?: RecordedRequest[];
  }
}

export async function readRequests(page: Page): Promise<RecordedRequest[]> {
  return page.evaluate<RecordedRequest[]>(
    () => window.__e2eRequests ?? [],
  );
}
