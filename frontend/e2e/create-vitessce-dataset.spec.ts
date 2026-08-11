import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("creating a Vitessce dataset fires POST /api/datasets with the data_type + file_type pair", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);

  await page.getByRole("button", { name: "Link Data Source" }).click();

  const dialog = page.getByRole("dialog");

  // Tab 1: switch the tool to Vitessce.
  await dialog.getByRole("button", { name: /^Vitessce\b/ }).click();
  await dialog.getByRole("button", { name: "Next" }).click();

  // Tab 2: pick a Data Type first. Once picked, the File Type dropdown
  // populates from the mapping — see `vitessceDataTypes.ts`.
  await dialog.getByLabel("Data Type").click();
  await page
    .getByRole("option", { name: /^Image \(image\)/ })
    .click();

  await dialog.getByLabel("File Type").click();
  await page.getByRole("option", { name: "image.ome-tiff" }).click();

  await dialog.getByRole("button", { name: "Next" }).click();

  // Tab 3: fill the basic fields. Vitessce datasets don't take an
  // assembly, so the tab is minimal — just URL + name.
  await dialog
    .getByLabel("Source URL")
    .fill("https://example.com/example.ome.tif");
  await dialog.getByLabel("Name").fill("E2E Vitessce Dataset");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual(
    expect.objectContaining({
      method: "POST",
      path: "/api/datasets",
      body: expect.objectContaining({
        workspace_uuid: PROJECT_ID,
        tool: "vitessce",
        dataset: expect.objectContaining({
          name: "E2E Vitessce Dataset",
          source_url: "https://example.com/example.ome.tif",
          file_type: "image.ome-tiff",
          data_type: "image",
        }),
      }),
    }),
  );
});
