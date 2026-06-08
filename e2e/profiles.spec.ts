import { test, expect } from "@playwright/test";

test("profile page shows stats and match history", async ({ page }) => {
  await page.goto("/player/1");
  await expect(page.getByText("Alpha")).toBeVisible();
  await expect(page.getByText("Stats by queue")).toBeVisible();
  await expect(page.getByText("Recent matches")).toBeVisible();
  await expect(page.getByText("Ascent")).toBeVisible();
});

test("match detail shows both teams' players", async ({ page }) => {
  await page.goto("/match/0123456789abcdef01234567");
  // Players from team A and team B are rendered in the scoreboard.
  await expect(page.getByText("Alpha")).toBeVisible();
  await expect(page.getByText("Bravo")).toBeVisible();
});

test("search finds a player and links to the profile", async ({ page }) => {
  await page.goto("/search?q=Alp");
  await page.getByText("Alpha").click();
  await expect(page).toHaveURL(/\/player\/1$/);
});
