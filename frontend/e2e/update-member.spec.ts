import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

const PROJECT_ID = "00000000-0000-0000-0000-000000000010";

test("changing a member's role fires PUT /api/workspaces/<uuid>/members", async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT_ID}`);

  // The mock workspace has one member, so the header button reads
  // "1 Collaborator".
  await page.getByRole("button", { name: "1 Collaborator" }).click();

  // The Role select shows the current permission ("Editor" for the mock
  // member with permissions: 2). Change it to Admin.
  await page.getByRole("combobox", { name: "Role" }).click();
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
