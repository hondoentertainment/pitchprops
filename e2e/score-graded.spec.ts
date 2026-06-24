import { test, expect } from "@playwright/test";

const STORE_KEY = "soccer-props-store-v1";

test("settlement uses score grading for 1X2 home pick", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /soccer prop markets/i })).toBeVisible({
    timeout: 15_000,
  });

  // First match card — home 1X2 button (first odds button is usually Home)
  await page.locator(".odds-btn").first().click();
  await page.getByRole("button", { name: /place (bet|parlay)/i }).click();
  await expect(page.getByRole("status")).toContainText(/bet placed/i);

  // Inject past resolve time; scores API returns deterministic mock results
  await page.evaluate(
    ({ key }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        state: {
          bets: {
            status: string;
            resolveAt: string;
            legs: { marketId: string; selectionId: string }[];
          }[];
        };
      };
      const past = new Date(Date.now() - 86_400_000).toISOString();
      data.state.bets = data.state.bets.map((b) =>
        b.status === "open" ? { ...b, resolveAt: past } : b
      );
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key: STORE_KEY }
  );

  await page.goto("/");
  await expect(page.getByRole("status")).toBeVisible({ timeout: 20_000 });

  await page.goto("/bets");
  await page.getByRole("button", { name: "open", exact: true }).click();
  await expect(page.getByText("No open bets.")).toBeVisible({ timeout: 10_000 });
});
