import { expect, test } from "@playwright/test";
import { readRequests } from "./_helpers";

test("editing the profile fires PUT /api/user with the form values", async ({
  page,
}) => {
  await page.goto("/");

  // The profile menu trigger is an avatar button showing the user's initials.
  // Our mocked user has first_name="E2E", last_name="User", so initials are "EU".
  await page.getByRole("button", { name: "EU" }).click();
  await page.getByRole("menuitem", { name: "View Profile" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("First Name").fill("Updated");
  await dialog.getByLabel("Last Name").fill("Name");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => readRequests(page)).toContainEqual({
    method: "PUT",
    path: "/api/user",
    body: { first_name: "Updated", last_name: "Name" },
  });
});
