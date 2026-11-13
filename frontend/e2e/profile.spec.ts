import { expect, type Page, test } from "@playwright/test";
import { readRequests } from "./_helpers";

async function gotoProfile(page: Page, flags: Record<string, unknown> = {}) {
  await page.addInitScript((flags) => Object.assign(window, flags), flags);
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "Your Profile" }),
  ).toBeVisible();
}

const aiUsage = (page: Page) => page.getByRole("region", { name: "AI Usage" });

test("View Profile opens the profile page", async ({ page }) => {
  await page.goto("/");
  // The avatar shows the mocked user's initials, "EU".
  await page.getByRole("button", { name: "EU" }).click();
  await page.getByRole("menuitem", { name: "View Profile" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.getByRole("heading", { name: "Your Profile" }),
  ).toBeVisible();
});

test("updating the name fires PUT /api/user", async ({ page }) => {
  await gotoProfile(page);
  await page.getByRole("button", { name: "Update name" }).click();

  const dialog = page.getByRole("dialog", { name: "Update Name" });
  await expect(dialog.getByLabel("First Name")).toHaveValue("E2E");
  await dialog.getByLabel("First Name").fill("Updated");
  await dialog.getByLabel("Last Name").fill("Name");
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect
    .poll(() => readRequests(page))
    .toContainEqual({
      method: "PUT",
      path: "/api/user",
      body: { first_name: "Updated", last_name: "Name" },
    });
  await expect(dialog).toBeHidden();
});

test("requesting AI access fires POST /api/yac/access", async ({ page }) => {
  await gotoProfile(page);
  await expect(aiUsage(page).getByText("Not Enabled")).toBeVisible();
  await aiUsage(page).getByRole("button", { name: "Request Access" }).click();

  await expect
    .poll(() => readRequests(page))
    .toContainEqual({
      method: "POST",
      path: "/api/yac/access",
      body: undefined,
    });
});

test("a pending request shows when it was sent", async ({ page }) => {
  await gotoProfile(page, { __e2eYacStatus: "pending" });
  await expect(aiUsage(page).getByText("Pending Review")).toBeVisible();
  await expect(
    aiUsage(page).getByText("Access request sent on Nov 6, 2026"),
  ).toBeVisible();
  await expect(
    aiUsage(page).getByRole("button", { name: "Access Requested" }),
  ).toBeDisabled();
});

for (const status of ["declined", "revoked"]) {
  test(`a ${status} request says there's no access`, async ({ page }) => {
    await gotoProfile(page, { __e2eYacStatus: status });
    await expect(aiUsage(page).getByText("Not Enabled")).toBeVisible();
    await expect(
      aiUsage(page).getByText("No Access to AI Resources"),
    ).toBeVisible();
  });
}

for (const [percent, chip, helper] of [
  [16, "Active", "Credits renew every month."],
  [90, "Near Limit", "You’ve used 90% of your credits."],
  [100, "Limit Reached", "You’ve used all your credits for this cycle."],
] as const) {
  test(`approved at ${percent}% shows ${chip}`, async ({ page }) => {
    await gotoProfile(page, {
      __e2eYacStatus: "approved",
      __e2eYacPercent: percent,
    });
    await expect(aiUsage(page).getByText(chip, { exact: true })).toBeVisible();
    await expect(
      aiUsage(page).getByText(helper, { exact: true }),
    ).toBeVisible();
    await expect(aiUsage(page).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(percent),
    );
  });
}

test("a fractional usage is shown as a whole percent", async ({ page }) => {
  await gotoProfile(page, {
    __e2eYacStatus: "approved",
    __e2eYacPercent: 85.7,
  });
  await expect(aiUsage(page).getByText("85%", { exact: true })).toBeVisible();
  await expect(
    aiUsage(page).getByText("Near Limit", { exact: true }),
  ).toBeVisible();
});

test("AI usage says so when access can't be loaded", async ({ page }) => {
  await gotoProfile(page, { __e2eYacAccessError: true });
  // React Query retries three times (about 7s) before reporting the error.
  await expect(
    aiUsage(page).getByText("AI usage is unavailable right now."),
  ).toBeVisible({ timeout: 15_000 });
});
