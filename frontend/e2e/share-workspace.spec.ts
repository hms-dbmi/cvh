import { expect, test } from "@playwright/test";
import { gotoWorkspace, readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("inviting a collaborator fires POST /api/workspaces/<uuid>/members", async ({
  page,
}) => {
  // Force the members fixture empty so the header button reads
  // "0 Collaborators".
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eEmptyMembers = true;
  });
  await gotoWorkspace(page, PROJECT_ID);

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

test("inviting an email with no account explains how to proceed", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eEmptyMembers = true;
    // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
    (window as any).__e2eMemberNotFound = true;
  });
  await gotoWorkspace(page, PROJECT_ID);

  await page.getByRole("button", { name: "0 Collaborators" }).click();

  const dialog = page.getByRole("dialog");
  const emailField = dialog.getByLabel("E-mail Address");
  await emailField.fill("nobody@example.com");
  await dialog.getByRole("button", { name: "Invite" }).click();

  await expect(
    page.getByText("No account found for nobody@example.com.", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText(
      "No account found for nobody@example.com. Ask them to sign up, then invite them again.",
    ),
  ).toBeVisible();

  // Editing the email clears the stale helper text.
  await emailField.fill("someone@example.com");
  await expect(dialog.getByText(/Ask them to sign up/)).toBeHidden();
});
