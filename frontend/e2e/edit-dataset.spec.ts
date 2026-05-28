import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";
const DATASET_ID = "00000000-0000-0000-0000-000000000400";

test("editing a dataset opens a prepopulated dialog and fires PUT /api/datasets/<uuid>", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);

  const datasetRow = page
    .getByRole("listitem")
    .filter({ hasText: "E2E Dataset" });
  await datasetRow.locator('button[aria-haspopup="true"]').click();
  await page.getByRole("menuitem", { name: "Edit Details" }).click();

  const dialog = page.getByRole("dialog");

  // The form is pre-populated from the mocked dataset fixture (bigwig).
  await expect(dialog.getByLabel("Name")).toHaveValue("E2E Dataset");
  await expect(dialog.getByLabel("Source URL")).toHaveValue(
    "https://example.com/example.bigwig",
  );
  // file_type is locked — the Data Type field is disabled and shows the
  // current value.
  await expect(dialog.getByLabel("Data Type")).toBeDisabled();
  await expect(dialog.getByLabel("Data Type")).toHaveValue("bigwig");

  await dialog.getByLabel("Name").fill("Updated Dataset Name");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual(
    expect.objectContaining({
      method: "PUT",
      path: `/api/datasets/${DATASET_ID}`,
      body: expect.objectContaining({
        name: "Updated Dataset Name",
        file_type: "bigwig",
      }),
    }),
  );
});
