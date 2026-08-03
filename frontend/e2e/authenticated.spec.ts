import { expect, test } from "@playwright/test";

test("authenticated user lands in the project view showing their workspace", async ({
  page,
}) => {
  // /project route with no slug auto-navigates to the user's first
  // workspace; the workspace switcher in the header displays its name.
  await page.goto("/project");
  await expect(page.getByText("E2E Test Project")).toBeVisible();
});
