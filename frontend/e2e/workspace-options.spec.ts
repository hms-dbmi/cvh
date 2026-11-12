import { expect, type Page, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

async function openOptions(page: Page) {
  await page.goto(`/project/${PROJECT_ID}`);
  await page
    .getByRole("button", { name: /E2E Test Project/i })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Options for E2E Test Project" })
    .click();
}

test("renaming a workspace fires PUT /api/workspaces/<uuid>", async ({
  page,
}) => {
  await openOptions(page);
  await page.getByRole("menuitem", { name: "Rename" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Workspace").fill("Renamed Workspace");
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect
    .poll(() => readRequests(page))
    .toContainEqual({
      method: "PUT",
      path: `/api/workspaces/${PROJECT_ID}`,
      body: { name: "Renamed Workspace" },
    });
});

test("deleting a workspace needs DELETE typed, then fires DELETE", async ({
  page,
}) => {
  await openOptions(page);
  await page.getByRole("menuitem", { name: "Delete" }).click();

  const dialog = page.getByRole("dialog");
  const deleteButton = dialog.getByRole("button", { name: "Delete" });
  await expect(deleteButton).toBeDisabled();
  await dialog.getByLabel("Type DELETE").fill("delete");
  await expect(deleteButton).toBeDisabled();
  await dialog.getByLabel("Type DELETE").fill("DELETE");
  await deleteButton.click();

  await expect
    .poll(() => readRequests(page))
    .toContainEqual({
      method: "DELETE",
      path: `/api/workspaces/${PROJECT_ID}`,
      body: undefined,
    });
  // It was the only workspace, so there's nowhere left but home.
  await expect(page).toHaveURL(/\/$/);
});

test("Shift+F10 on a workspace tile opens its options", async ({ page }) => {
  await page.goto(`/project/${PROJECT_ID}`);
  await page
    .getByRole("button", { name: /E2E Test Project/i })
    .first()
    .click();
  await page
    .getByRole("menuitem", { name: /E2E Test Project/ })
    .press("Shift+F10");
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible();
});

test("viewers don't get workspace options", async ({ page }) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e flag
    (window as any).__e2eReadOnlyWorkspace = true;
  });
  await page.goto(`/project/${PROJECT_ID}`);
  await page
    .getByRole("button", { name: /E2E Test Project/i })
    .first()
    .click();
  await expect(
    page.getByRole("menuitem", { name: /E2E Test Project/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Options for E2E Test Project" }),
  ).toHaveCount(0);
});
