import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("inviting a collaborator fires POST /api/workspaces/<uuid>/members", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);

  // The header button label is "<count> Collaborators". Our mock returns
  // an empty members list, so it reads "0 Collaborators".
  await page.getByRole("button", { name: "0 Collaborators" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("E-mail Address").fill("invitee@example.com");
  await dialog.getByRole("button", { name: "Invite" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "POST",
    path: `/api/workspaces/${PROJECT_ID}/members`,
    body: { email: "invitee@example.com" },
  });
});
