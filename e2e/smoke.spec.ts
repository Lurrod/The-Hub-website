import { test, expect } from "@playwright/test";

test("landing page shows the hero and CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Explore the ladders" })).toBeVisible();
});

test("leaderboard renders and shows top player", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(page.getByText("Leaderboard", { exact: true })).toBeVisible();
  await expect(page.getByText("Alpha")).toBeVisible();
});

test("stats page sorts by column", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.getByText("Alpha")).toBeVisible();
  await page.getByRole("columnheader", { name: "ELO" }).getByRole("button").click();
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toContainText("Alpha");
});
