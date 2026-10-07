import { expect, type Page } from "@playwright/test";

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

/**
 * Open the E2E workspace and wait for it to settle before interacting.
 * The workspace renders in stages (visualization list → selected
 * visualization → swap from the Gosling to the Vitessce shell, which
 * remounts the sidebar → Vitessce viewer). A click that lands mid-way can
 * be lost, which showed up as dialogs never opening on a cold dev server.
 * The fixture's visualization is Vitessce, so its bottom bar marks the end.
 */
export async function gotoWorkspace(page: Page, projectId: string) {
  await page.goto(`/project/${projectId}`);
  await expect(
    page.getByRole("group", { name: "Visualization mode" }),
  ).toBeVisible({ timeout: 20_000 });
}
