import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("changing a member's role fires PUT /api/workspaces/<uuid>/members", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);

  // The mock workspace has two members (the current user + one other),
  // so the header button reads "1 Collaborator" — the count subtracts
  // the viewer.
  await page.getByRole("button", { name: "1 Collaborator" }).click();

  // The dialog lists every member, so there are two Role selects — the
  // viewer's row (disabled, "Admin") and the target member's row. Scope
  // to the member's list item so the click targets only that row's
  // dropdown.
  const memberRow = page
    .getByRole("listitem")
    .filter({ hasText: "member@example.com" });
  await memberRow.getByRole("combobox", { name: "Role" }).click();
  await page.getByRole("option", { name: "Admin" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "PUT",
    path: `/api/workspaces/${PROJECT_ID}/members`,
    // The MUI Select forwards the option value as the string the form
    // bound to it; the API takes a number, but the wire format is a string
    // here (the typed-as-number cast in PermissionsSelect is just an
    // assertion — no real conversion happens).
    body: { permissions: "3", email: "member@example.com" },
  });
});
