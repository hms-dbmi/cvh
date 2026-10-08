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
  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "PUT",
    path: `/api/visualizations/${VIZ_ID}`,
    body: { published: true },
  });
});

test("the sharing menu downloads a QR code for the public link", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2ePublishedWorkspaceViz = true;
  });
  await gotoWorkspace(page, PROJECT_ID);
  await page.getByRole("button", { name: "Published", exact: true }).click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Download QR Code" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(
    "e2e-workspace-vitessce-qr-code.png",
  );
  // PNG signature: the file is a real image, not an error page.
  const stream = await download.createReadStream();
  const [firstChunk] = await stream.toArray();
  expect(firstChunk.subarray(0, 4).toString("hex")).toBe("89504e47");
  await expect(page.getByText("QR code downloaded.")).toBeVisible();
});
