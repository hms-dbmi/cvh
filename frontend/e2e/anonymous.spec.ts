import { expect, test } from "@playwright/test";

test("anonymous landing renders the marketing headline", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Create and Share Interactive Genomics Data Visualizations/i,
    }),
  ).toBeVisible();
});

test("public visualization route loads the mocked viz", async ({ page }) => {
  await page.goto("/visualizations/00000000-0000-0000-0000-000000000100");
  await expect(
    page.getByRole("heading", { name: "E2E Public Visualization", level: 1 }),
  ).toBeVisible();
});
