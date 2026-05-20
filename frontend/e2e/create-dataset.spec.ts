import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("creating a bigwig dataset fires POST /api/datasets", async ({ page }) => {
  await page.goto(`/project/${PROJECT_ID}`);

  await page.getByRole("button", { name: "Add Data Source" }).click();

  // Tab 1: pick the file type, then advance. Each file-type button's
  // accessible name is "<type> <tooltip>", so we match by leading text.
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /^bigwig\b/ }).click();
  await dialog.getByRole("button", { name: "Next" }).click();

  // Tab 2: fill the basic fields (file_type is locked from tab 1, assembly
  // defaults to hg38, data_type stays empty by default).
  await dialog
    .getByLabel("Source URL")
    .fill("https://example.com/example.bigwig");
  await dialog.getByLabel("Name").fill("My E2E Dataset");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "POST",
    path: "/api/datasets",
    body: {
      dataset: {
        name: "My E2E Dataset",
        description: "",
        source_url: "https://example.com/example.bigwig",
        data_type: "",
        assembly: "hg38",
        file_type: "bigwig",
      },
      workspace_uuid: PROJECT_ID,
    },
  });
});
