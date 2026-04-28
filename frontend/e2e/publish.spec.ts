import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const VIZ_ID = "00000000-0000-0000-0000-000000000200";
const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("publishing a Vitessce viz fires PUT with published: true", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);
  await page.getByRole("button", { name: "Make Public" }).click();

  await expect.poll(() => readRequests(page)).toEqual([
    {
      method: "PUT",
      path: `/api/visualizations/${VIZ_ID}`,
      body: { published: true },
    },
  ]);
});
