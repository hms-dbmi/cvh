import { expect, test } from "@playwright/test";

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
});

test("public Vitessce visualization route renders the side panel", async ({
  page,
}) => {
  await page.goto("/visualizations/00000000-0000-0000-0000-000000000101");
  await expect(
    page.getByRole("heading", { name: "E2E Public Vitessce", level: 1 }),
  ).toBeVisible();
});
