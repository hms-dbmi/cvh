import { expect, test } from "@playwright/test";
import { gotoWorkspace, readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";
const CFDB_API_URL = "http://127.0.0.1:9100";
const BIGWIG_LOCAL_ID = "e2e-bigwig-1";
// Per CFDB_DCC_URL_SLUG in src/api/cfdb.ts: GraphQL `4DN_DCIC` → `/data/4dn`.
const EXPECTED_SOURCE_URL = `${CFDB_API_URL}/data/4dn/${BIGWIG_LOCAL_ID}`;

test("adding a bigwig from the data library posts /api/datasets with the CFDB source url", async ({
  page,
}) => {
  await gotoWorkspace(page, PROJECT_ID);

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

test("Explore asks for AI access before showing the chat", async ({ page }) => {
  await gotoWorkspace(page, PROJECT_ID);
  await page.getByRole("button", { name: "Browse Library" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("4D NUCLEOME DATA COORDINATION").click();

  await dialog.getByRole("tab", { name: /Explore/ }).click();

  // The mocked user hasn't asked for access yet: the profile's banner, and
  // nothing to select until the chat's filters narrow the files.
  await expect(
    dialog.getByText("AI features aren’t enabled for your account."),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Request Access" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Continue to Select Files" }),
  ).toBeDisabled();

  // Escape belongs to the chat's inputs here; it mustn't close the dialog.
  // (Closing resets to Browse at once, before the dialog fades out.)
  await page.keyboard.press("Escape");
  await expect(dialog.getByRole("tab", { name: /Explore/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  // Back on Browse, the file table is still there.
  await dialog.getByRole("tab", { name: "Browse" }).click();
  await expect(
    dialog.getByRole("row").filter({ hasText: "e2e-track.bigwig" }),
  ).toBeVisible();

  // No message was sent, so there's no conversation to lose: leaving the
  // library doesn't ask first.
  await dialog.getByRole("button", { name: "Back to Data Catalogs" }).click();
  await expect(
    page.getByRole("dialog", { name: "Leave this library?" }),
  ).toBeHidden();
  await expect(dialog.getByText("4D NUCLEOME DATA COORDINATION")).toBeVisible();
});

test("a long Explore conversation scrolls inside the chat, not the page", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.assign(window, { __e2eYacStatus: "approved" }),
  );
  await gotoWorkspace(page, PROJECT_ID);
  await page.getByRole("button", { name: "Browse Library" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("4D NUCLEOME DATA COORDINATION").click();
  await dialog.getByRole("tab", { name: /Explore/ }).click();
  const chat = page.locator(".udi-yac");
  await expect(chat).toBeVisible();
  const content = page.locator(".MuiDialogContent-root");
  const overflow = () =>
    content.evaluate((el) => el.scrollHeight - el.clientHeight);
  const chatHeight = () => chat.evaluate((el) => el.clientHeight);
  const before = { overflow: await overflow(), chat: await chatHeight() };

  // Stand-in for a long session: tall content in udi-yac's outer layout,
  // which (unlike its chat column) doesn't clip, as with a tall data panel
  // or chart grid.
  await chat.evaluate((root) => {
    const tall = document.createElement("div");
    tall.style.height = "3000px";
    root.firstElementChild?.appendChild(tall);
  });

  // The chat keeps its height and scrolls inside; the dialog doesn't grow.
  expect(await chatHeight()).toBe(before.chat);
  expect(await overflow()).toBe(before.overflow);
});
