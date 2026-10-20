import { expect, type Page, test } from "@playwright/test";

// The public page shows the workspace's "Published" button, with only the
// sharing actions a visitor can use.
async function expectVisitorSharingMenu(page: Page) {
  await page.getByRole("button", { name: "Published", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText(["Copy link"]);
}

// The bar's toggle hides and restores the side panel.
async function expectSidebarToggle(page: Page) {
  const panel = page.getByRole("heading", { level: 1 });
  await expect(panel).toBeVisible();

  await page.getByRole("button", { name: "Hide sidebar" }).click();
  await expect(panel).toBeHidden();
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
  await expectVisitorSharingMenu(page);
  await page.keyboard.press("Escape");
  await expectSidebarToggle(page);
});

test("public Vitessce visualization route renders the side panel", async ({
  page,
}) => {
  await page.goto("/visualizations/00000000-0000-0000-0000-000000000101");
  await expect(
    page.getByRole("heading", { name: "E2E Public Vitessce", level: 1 }),
  ).toBeVisible();
  await expectVisitorSharingMenu(page);
  await page.keyboard.press("Escape");
  await expectSidebarToggle(page);
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
