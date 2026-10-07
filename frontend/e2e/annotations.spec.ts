import { expect, type Page, test } from "@playwright/test";
import { gotoWorkspace, readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";
const VIZ_ID = "00000000-0000-0000-0000-000000000200";

type View = {
  component: string;
  w: number;
  h: number;
  props?: { closeButtonVisible?: boolean };
};
type SavedConf = {
  layout: View[];
  coordinationSpace: {
    annotationEditable?: Record<string, boolean>;
    annotationStory?: Record<string, unknown>;
  };
};

async function savedConfs(page: Page) {
  return (await readRequests(page))
    .filter(
      (r) =>
        r.method === "PUT" &&
        r.path === `/api/visualizations/${VIZ_ID}` &&
        (r.body as { conf?: unknown }).conf,
    )
    .map((r) => (r.body as { conf: SavedConf }).conf);
}

// One page load for the whole flow: Vitessce is the expensive part of each
// spec, so the checks share it rather than splitting into separate tests.
test("annotating adds an editable panel that is saved read-only and can be closed", async ({
  page,
}) => {
  // Two side-by-side views, 2 rows tall (fewer rows than the 12 the
  // Vitessce helper gives the panel by default).
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eTwoViewVitessce = true;
  });
  await gotoWorkspace(page, PROJECT_ID);

  const panelHeader = page
    .getByRole("banner")
    .filter({ has: page.getByRole("heading", { name: "Annotation" }) });
  const closePanel = panelHeader.getByRole("button", {
    name: "Close panel button",
  });
  const createStory = page.getByRole("button", { name: /create a story/i });

  // Annotating: the panel appears, editable, with no close button.
  await page.getByRole("button", { name: "Annotating" }).click();
  await expect(createStory).toBeVisible();
  await expect(closePanel).toHaveCount(0);

  // Saved read-only, closable, and sized to the existing 2 rows.
  await page.getByRole("button", { name: "Save" }).click();
  await expect.poll(async () => (await savedConfs(page)).length).toBe(1);
  const [annotated] = await savedConfs(page);
  const panel = annotated.layout.find(
    (v) => v.component === "annotationController",
  );
  expect(panel?.h).toBe(2);
  expect(panel?.props?.closeButtonVisible).toBe(true);
  expect(
    Object.values(annotated.coordinationSpace.annotationEditable ?? {}),
  ).not.toContain(true);

  // Exploring: read-only, and the panel can be closed.
  await page.getByRole("button", { name: "Exploring" }).click();
  await expect(closePanel).toBeVisible();
  await expect(createStory).toHaveCount(0);
  await closePanel.click();
  await expect(panelHeader).toHaveCount(0);

  // Closing hands the panel's columns back to the original views.
  await page.getByRole("button", { name: "Save" }).click();
  await expect.poll(async () => (await savedConfs(page)).length).toBe(2);
  const closed = (await savedConfs(page))[1];
  expect(closed.layout.map((v) => [v.component, v.w])).toEqual([
    ["description", 7],
    ["status", 5],
  ]);
});

test("leaving with unsaved annotations asks first, and Save stores them before leaving", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eTwoViewVitessce = true;
  });
  await gotoWorkspace(page, PROJECT_ID);
  const dialog = page.getByRole("dialog", { name: "Unsaved annotations" });
  const workspaceUrl = page.url();

  await page.getByRole("button", { name: "Annotating" }).click();
  await page.getByRole("button", { name: /create a story/i }).click();

  // Keep editing stays put.
  await page.getByRole("link", { name: "Tutorials" }).click();
  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(dialog).toBeHidden();
  expect(page.url()).toBe(workspaceUrl);

  // Save stores the story, then continues to where the user was going.
  await page.getByRole("link", { name: "Tutorials" }).click();
  await dialog.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/tutorials/);
  const [saved] = await savedConfs(page);
  expect(
    Object.values(saved.coordinationSpace.annotationStory ?? {}).filter(
      Boolean,
    ),
  ).toHaveLength(1);
});
