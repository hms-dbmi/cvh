import { expect, test } from "@playwright/test";
import { gotoWorkspace, readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

async function fillNewVizDialog(
  page: import("@playwright/test").Page,
  { name, tool }: { name: string; tool: "gosling" | "vitessce" },
) {
  await gotoWorkspace(page, PROJECT_ID);
  await page.getByRole("button", { name: "New Visualization" }).click();

  // Gate on the dialog being present before filling fields — cold CI
  // runners occasionally reach the getByLabel before MUI's Dialog and
  // its child inputs finish mounting.
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("Description").fill(`E2E ${tool} viz`);
  // The creator is always an author; add the other workspace member.
  await expect(dialog.getByText("E2E User (you)")).toBeVisible();
  await dialog.getByRole("combobox", { name: "Authors" }).click();
  await page.getByRole("option", { name: /Member User/ }).click();
  // The tool select is a MUI <TextField select> rendered as a combobox.
  await dialog.getByRole("combobox", { name: "Tool" }).click();
  await page.getByRole("option", { name: tool }).click();
  await dialog.getByRole("button", { name: "Submit" }).click();
}

test("creating a Gosling visualization fires POST with tool: gosling", async ({
  page,
}) => {
  await fillNewVizDialog(page, { name: "My Gosling Viz", tool: "gosling" });

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "POST",
    path: "/api/visualizations",
    body: {
      name: "My Gosling Viz",
      description: "E2E gosling viz",
      author_usernames: ["member"],
      tool: "gosling",
      workspace_uuid: PROJECT_ID,
    },
  });
});

test("creating a Vitessce visualization fires POST with tool: vitessce", async ({
  page,
}) => {
  await fillNewVizDialog(page, { name: "My Vitessce Viz", tool: "vitessce" });

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "POST",
    path: "/api/visualizations",
    body: {
      name: "My Vitessce Viz",
      description: "E2E vitessce viz",
      author_usernames: ["member"],
      tool: "vitessce",
      workspace_uuid: PROJECT_ID,
    },
  });
});
