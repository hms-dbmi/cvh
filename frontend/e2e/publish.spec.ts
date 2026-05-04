import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const VIZ_ID = "00000000-0000-0000-0000-000000000200";
const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("publishing a Vitessce viz fires PUT with published: true", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);
  await page.getByRole("button", { name: "Make Public" }).click();

  // The Vitessce viewer also auto-saves its `conf` on mount, so other PUTs
  // can land in the log too — we only care that the publish call fired.
  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "PUT",
    path: `/api/visualizations/${VIZ_ID}`,
    body: { published: true },
  });
});
