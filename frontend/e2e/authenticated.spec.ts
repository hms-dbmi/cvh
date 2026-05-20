import { expect, test } from "@playwright/test";

test("authenticated user sees their workspaces on /projects", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.getByText("E2E Test Project")).toBeVisible();
});
