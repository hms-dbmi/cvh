import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

test("creating a workspace fires POST /api/workspaces with the form values", async ({
  page,
}) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Create New Workspace" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("My E2E Workspace");
  await dialog.getByLabel("Description").fill("Created via Playwright");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "POST",
    path: "/api/workspaces",
    body: {
      name: "My E2E Workspace",
      description: "Created via Playwright",
      private: true,
    },
  });
});
