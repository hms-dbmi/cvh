import { expect, type Page, test } from "@playwright/test";
import { gotoWorkspace, readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";
const VIZ_PATH = "/api/visualizations/00000000-0000-0000-0000-000000000200";

// A valid config (the workspace fixture's), named so each save can be told
// apart.
function config(name: string) {
  return JSON.stringify(
    {
      version: "1.0.15",
      name,
      description: "",
      datasets: [],
      initStrategy: "auto",
      coordinationSpace: {},
      layout: [],
    },
    null,
    2,
  );
}

// Monaco ignores Playwright's keyboard shortcuts unreliably, so drive it
// through its own API, as typing would.
async function setEditorText(page: Page, text: string) {
  await page.evaluate((value) => {
    // biome-ignore lint/suspicious/noExplicitAny: Monaco's global, e2e only
    (window as any).monaco.editor.getEditors()[0].setValue(value);
  }, text);
}

function editorText(page: Page) {
  return page.evaluate(
    // biome-ignore lint/suspicious/noExplicitAny: Monaco's global, e2e only
    () => (window as any).monaco.editor.getEditors()[0].getValue() as string,
  );
}

async function savedNames(page: Page) {
  return (await readRequests(page))
    .filter((r) => r.method === "PUT" && r.path === VIZ_PATH)
    .map((r) => (r.body as { conf?: { name?: string } }).conf?.name);
}

test("edits typed while an autosave is in flight survive the refetch", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eSlowSave = true;
  });
  await gotoWorkspace(page, PROJECT_ID);
  await page.getByRole("button", { name: "Editing" }).click();
  await expect
    .poll(() =>
      // biome-ignore lint/suspicious/noExplicitAny: Monaco's global, e2e only
      page.evaluate(() => !!(window as any).monaco?.editor.getEditors()[0]),
    )
    .toBe(true);

  // The first edit autosaves after the debounce; the save is held open.
  await setEditorText(page, config("First save"));
  await expect.poll(() => savedNames(page)).toContain("First save");

  // Keep editing while it's in flight. Its refetch (after the mock's 1.5s
  // hold) lands before this edit's own 2.5s autosave, and used to put the
  // server's text back and cancel that autosave.
  await setEditorText(page, config("Typed during save"));
  await expect
    .poll(() => savedNames(page), { timeout: 10_000 })
    .toContain("Typed during save");
  expect(await editorText(page)).toContain("Typed during save");
});
