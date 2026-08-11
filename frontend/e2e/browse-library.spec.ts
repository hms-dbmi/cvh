import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";
const CFDB_API_URL = "http://127.0.0.1:9100";
const BIGWIG_LOCAL_ID = "e2e-bigwig-1";
// Per CFDB_DCC_URL_SLUG in src/api/cfdb.ts: GraphQL `4DN_DCIC` → `/data/4dn`.
const EXPECTED_SOURCE_URL = `${CFDB_API_URL}/data/4dn/${BIGWIG_LOCAL_ID}`;

test("adding a bigwig from the data library posts /api/datasets with the CFDB source url", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);

  const browse = page.getByRole("button", { name: "Browse Library" });
  await browse.click();

  // Pick the only mocked DCC.
  const dialog = page.getByRole("dialog");
  await dialog.getByText("4D NUCLEOME DATA COORDINATION").click();

  // The mocked file list has one bigwig and one BAM — both are
  // supported (bigwig as a ready type, BAM as a cfdb-processable type)
  // so both checkboxes should be enabled. Toggle the bigwig row.
  const bigwigRow = dialog
    .getByRole("row")
    .filter({ hasText: "e2e-track.bigwig" });
  await expect(bigwigRow.getByRole("checkbox")).toBeEnabled();
  await bigwigRow.getByRole("checkbox").check();

  // The visible pill reads "+ Add to  [E2E Test Project]" but the
  // workspace-name half is a sibling Box, not part of the button.
  // The button's accessible name is just "Add to". A separate
  // workspace-picker click is only needed when the user wants to
  // change the target workspace — the current workspace is
  // pre-selected via the URL.
  await dialog.getByRole("button", { name: "Add to" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "POST",
    path: "/api/datasets",
    body: {
      workspace_uuid: PROJECT_ID,
      dataset: {
        name: "e2e-track.bigwig",
        source_url: EXPECTED_SOURCE_URL,
        data_type: "bigwig",
        assembly: "hg38",
        file_type: "bigwig",
      },
    },
  });
});
