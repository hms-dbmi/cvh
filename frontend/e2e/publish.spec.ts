import { expect, test } from "@playwright/test";
import { gotoWorkspace, readRequests } from "./_helpers";

const VIZ_ID = "00000000-0000-0000-0000-000000000200";
const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("publishing a Vitessce viz fires PUT with published: true", async ({
  page,
}) => {
  await gotoWorkspace(page, PROJECT_ID);
  await page.getByRole("button", { name: "Make Public" }).click();

  // The Vitessce viewer also auto-saves its `conf` on mount, so other PUTs
  // can land in the log too — we only care that the publish call fired.
  await expect
    .poll(() => readRequests(page))
    .toContainEqual({
      method: "PUT",
      path: `/api/visualizations/${VIZ_ID}`,
      body: { published: true },
    });
});

test("read-only members can share a published visualization but not make it private", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2ePublishedWorkspaceViz = true;
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eReadOnlyWorkspace = true;
  });
  await gotoWorkspace(page, PROJECT_ID);
  await page.getByRole("button", { name: "Published", exact: true }).click();

  await expect(page.getByRole("menuitem")).toHaveText([
    "Open Public View",
    "Copy link",
  ]);
});
