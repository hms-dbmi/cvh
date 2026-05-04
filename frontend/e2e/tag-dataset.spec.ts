import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";
const DATASET_ID = "00000000-0000-0000-0000-000000000400";

test("tagging a dataset fires PUT /api/datasets/<uuid>/tags", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);

  const datasetRow = page
    .getByRole("listitem")
    .filter({ hasText: "E2E Dataset" });
  await datasetRow.locator('button[aria-haspopup="true"]').click();
  await page.getByRole("menuitem", { name: "Edit Tags" }).click();

  const dialog = page.getByRole("dialog");
  // The dataset mock has no existing tags; the form's initial reset wipes
  // the default empty row, so click "Add Tag" before filling.
  await dialog.getByRole("button", { name: "Add Tag" }).click();
  await dialog.getByLabel("Title").fill("source");
  await dialog.getByLabel("Value").fill("e2e");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "PUT",
    path: `/api/datasets/${DATASET_ID}/tags`,
    body: { tags: [{ key: "source", tag: "e2e" }] },
  });
});
