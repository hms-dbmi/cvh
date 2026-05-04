import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("adding example datasets fires POST /api/examples with the workspace uuid", async ({
  page,
}) => {
  // The "Example Data Sources" button only renders in the empty-state UI
  // for the dataset panel, so force the datasets fixture empty for this
  // spec.
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eEmptyDatasets = true;
  });
  await page.goto(`/project/${PROJECT_ID}`);

  await page.getByRole("button", { name: "Example Data Sources" }).click();

  const dialog = page.getByRole("dialog");
  // Each example renders as a clickable Stack with the title as a heading.
  await dialog.getByRole("paragraph").filter({ hasText: "Two Basic Views" }).click();
  await dialog
    .getByRole("button", { name: "Add Selected Data Sources to Workspace" })
    .click();

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "POST",
    path: "/api/examples",
    body: {
      example_id: 1,
      workspace_uuid: PROJECT_ID,
      include_visualizations: false,
    },
  });
});
