import { expect, test } from "@playwright/test";
import { gotoWorkspace } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("the sidebar toggle hides the sidebar and the Vitessce viewer fills the space", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eTwoViewVitessce = true;
  });
  await gotoWorkspace(page, PROJECT_ID);
  const search = page.getByPlaceholder("Search for a visualization...");
  // Measure a view, not the grid container: the container widens on its
  // own, but the views only re-lay out when Vitessce re-measures.
  const statusView = page
    .locator(".react-grid-item")
    .filter({ has: page.getByRole("heading", { name: "Status" }) });
  const openWidth = (await statusView.boundingBox())?.width ?? 0;

  await page.getByRole("button", { name: "Hide sidebar" }).click();
  await expect(search).toBeHidden();
  // Vitessce's grid only re-measures on window resize; the toggle nudges it.
  // The status view spans 5 of 12 columns, so it gains ~5/12 of the 400px.
  await expect
    .poll(async () => (await statusView.boundingBox())?.width ?? 0)
    .toBeGreaterThan(openWidth + 100);

  await page.getByRole("button", { name: "Show sidebar" }).click();
  await expect(search).toBeVisible();
});

test("the sidebar toggle also appears in the Gosling bottom bar", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eGoslingWorkspace = true;
  });
  // Not `gotoWorkspace`: it waits for the Vitessce bottom bar.
  await page.goto(`/project/${PROJECT_ID}`);
  const search = page.getByPlaceholder("Search for a visualization...");

  await page.getByRole("button", { name: "Hide sidebar" }).click();
  await expect(search).toBeHidden();
  await page.getByRole("button", { name: "Show sidebar" }).click();
  await expect(search).toBeVisible();
});
