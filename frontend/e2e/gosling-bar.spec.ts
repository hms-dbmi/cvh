import { expect, test } from "@playwright/test";
import { expectBottomBarOnScreen } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

// One page load for the whole Gosling bar: the designer is the expensive
// part, so the checks share it.
test("the Gosling bottom bar edits, explores, exports and shares", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eGoslingWorkspace = true;
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2ePublishedWorkspaceViz = true;
  });
  await page.goto(`/project/${PROJECT_ID}`);

  // A published visualization never offers "Make Public", even while loading.
  await page.getByRole("button", { name: "Hide sidebar" }).waitFor();
  expect(await page.getByRole("button", { name: "Make Public" }).count()).toBe(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Published", exact: true }),
  ).toBeVisible();
  await expectBottomBarOnScreen(page);

  // Editing: undo/redo and Save.
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Redo" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

  // Exploring: the designer's exports replace them.
  await page.getByRole("button", { name: "Exploring" }).click();
  await expect(page.getByRole("button", { name: "Undo" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
  const [specDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export specification" }).click(),
  ]);
  expect(specDownload.suggestedFilename()).toMatch(/\.json$/);

  // Sharing: the same menu as Vitessce.
  await page.getByRole("button", { name: "Published", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Copy link" })).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "Make Private" }),
  ).toBeVisible();
});

test("read-only members explore and share a published Gosling visualization", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eGoslingWorkspace = true;
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2ePublishedWorkspaceViz = true;
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eReadOnlyWorkspace = true;
  });
  await page.goto(`/project/${PROJECT_ID}`);

  // Exploring is their only mode, so the bar has no mode switch, Save,
  // undo/redo or exports (the designer only offers exports to editors).
  await expect(
    page.getByRole("button", { name: "Published", exact: true }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole("group", { name: "Visualization mode" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Export specification" }),
  ).toHaveCount(0);
  // The designer's old workspace-link button is replaced by the menu.
  await expect(page.getByRole("button", { name: /copy link/i })).toHaveCount(0);

  await page.getByRole("button", { name: "Published", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Open Public View",
    "Copy link",
  ]);
});
