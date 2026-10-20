import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectBottomBarOnScreen } from "./_helpers";

// The public page shows the workspace's "Published" button, with only the
// sharing actions a visitor can use.
async function expectVisitorSharingMenu(page: Page) {
  await page.getByRole("button", { name: "Published", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText(["Copy link"]);
}

// The bar's toggle hides and restores the side panel, found by the
// visualization's name. `widens`, if given, must grow once it's hidden.
async function expectSidebarToggle(page: Page, name: string, widens?: Locator) {
  // Vitessce's view titles are level-1 headings too, so match by name.
  const panel = page.getByRole("heading", { name, level: 1 });
  await expect(panel).toBeVisible();
  const openWidth = (await widens?.boundingBox())?.width ?? 0;

  await page.getByRole("button", { name: "Hide sidebar" }).click();
  await expect(panel).toBeHidden();
  if (widens) {
    await expect
      .poll(async () => (await widens.boundingBox())?.width ?? 0)
      .toBeGreaterThan(openWidth + 100);
  }
  await page.getByRole("button", { name: "Show sidebar" }).click();
  await expect(panel).toBeVisible();
}

test("anonymous landing renders the marketing headline", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Create and Share Interactive Visualization for Genomics/i,
    }),
  ).toBeVisible();
});

test("public Gosling visualization route loads", async ({ page }) => {
  await page.goto("/visualizations/00000000-0000-0000-0000-000000000100");
  await expect(
    page.getByRole("heading", { name: "E2E Public Visualization", level: 1 }),
  ).toBeVisible();
  await expectBottomBarOnScreen(page);
  await expectVisitorSharingMenu(page);
  await page.keyboard.press("Escape");
  await expectSidebarToggle(page, "E2E Public Visualization");
});

test("public Vitessce visualization route renders the side panel", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eTwoViewVitessce = true;
  });
  await page.goto("/visualizations/00000000-0000-0000-0000-000000000101");
  await expect(
    page.getByRole("heading", { name: "E2E Public Vitessce", level: 1 }),
  ).toBeVisible();
  await expectBottomBarOnScreen(page);
  await expectVisitorSharingMenu(page);
  await page.keyboard.press("Escape");
  // Measure a view, not the grid: views only re-lay out when Vitessce
  // re-measures, which the toggle's resize nudge triggers.
  const statusView = page
    .locator(".react-grid-item")
    .filter({ has: page.getByRole("heading", { name: "Status" }) });
  await expect(statusView).toBeVisible();
  await expectSidebarToggle(page, "E2E Public Vitessce", statusView);
});

test("public pages start with the sidebar closed on phones", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/visualizations/00000000-0000-0000-0000-000000000101");
  await expect(
    page.getByRole("button", { name: "Show sidebar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "E2E Public Vitessce", level: 1 }),
  ).toBeHidden();
});

test("public visitors see annotations without edit controls", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eAnnotatedPublicViz = true;
  });
  await page.goto("/visualizations/00000000-0000-0000-0000-000000000101");
  await expect(
    page.getByRole("heading", { name: "Annotation", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /create a story/i }),
  ).toHaveCount(0);
});
