import { test, expect } from "@playwright/test";

test("/me prompts for login when signed out", async ({ page }) => {
  await page.goto("/me");
  await expect(page.getByText("Sign in to edit your profile.")).toBeVisible();
  // Scope to <main> so we match the page button, not the navbar button
  await expect(
    page.getByRole("main").getByRole("button", { name: /Login with Discord/i })
  ).toBeVisible();
});
