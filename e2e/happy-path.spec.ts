import { test, expect } from "@playwright/test";

const STORE_KEY = "soccer-props-store-v1";

test("place bet, settle, and see result on dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /soccer prop markets/i })).toBeVisible({
    timeout: 15_000,
  });

  const oddsBtn = page.locator(".odds-btn").first();
  await expect(oddsBtn).toBeVisible();
  await oddsBtn.click();

  // Adding a selection auto-opens the slip drawer.
  await expect(page.getByRole("dialog", { name: /bet slip/i })).toBeVisible();

  await page.getByRole("button", { name: /place (bet|parlay)/i }).click();

  await expect(page.getByRole("status")).toContainText(/bet placed/i, { timeout: 5000 });

  await page.goto("/bets");
  await expect(page.getByText(/open/i).first()).toBeVisible();

  await page.evaluate(
    ({ key }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        state: { bets: { status: string; resolveAt: string }[] };
      };
      const past = new Date(Date.now() - 86_400_000).toISOString();
      data.state.bets = data.state.bets.map((b) =>
        b.status === "open" ? { ...b, resolveAt: past } : b
      );
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key: STORE_KEY }
  );

  await page.reload();
  await expect(page.getByRole("status")).toBeVisible({ timeout: 20_000 });
});
