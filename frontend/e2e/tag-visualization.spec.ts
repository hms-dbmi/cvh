import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";
const VIZ_ID = "00000000-0000-0000-0000-000000000200";

test("tagging a visualization fires PUT /api/visualizations/<uuid>/tags", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);

  // Open the kebab menu on the viz row, then "Edit Tags".
  const vizRow = page
    .getByRole("listitem")
    .filter({ hasText: "E2E Workspace Vitessce" });
  await vizRow.locator('button[aria-haspopup="true"]').click();
  await page.getByRole("menuitem", { name: "Edit Tags" }).click();

  const dialog = page.getByRole("dialog");
  // The viz mock has no existing tags, so the dialog opens with zero rows
  // (the form's initial reset wipes the default empty row). Click "Add Tag"
  // to render an empty row.
  await dialog.getByRole("button", { name: "Add Tag" }).click();
  await dialog.getByLabel("Title").fill("project");
  await dialog.getByLabel("Value").fill("e2e-test");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "PUT",
    path: `/api/visualizations/${VIZ_ID}/tags`,
    body: { tags: [{ key: "project", tag: "e2e-test" }] },
  });
});
