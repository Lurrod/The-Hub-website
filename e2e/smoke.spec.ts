import { test, expect } from "@playwright/test";

test("leaderboard renders and shows top player", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Leaderboard", { exact: true })).toBeVisible();
  await expect(page.getByText("Alpha")).toBeVisible();
});

test("stats page sorts by column", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.getByText("Alpha")).toBeVisible();
  await page.locator("th", { hasText: "ELO" }).click();
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toContainText("Alpha");
});
