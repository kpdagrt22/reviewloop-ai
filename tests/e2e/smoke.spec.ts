import { test, expect } from "@playwright/test";

/**
 * Smoke E2E. Exercises the public surface that renders without a live Supabase
 * project. The full authenticated flow (org → customer → request → review →
 * AI reply → testimonial) is documented in docs/VALIDATION_PLAN.md and is run
 * against a configured Supabase instance.
 */

test("landing page shows the hero and primary CTA", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /get more 5-star reviews without chasing customers manually/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /start review loop/i }).first()).toBeVisible();
});

test("pricing page lists all plans", async ({ page }) => {
  await page.goto("/pricing");
  for (const plan of ["Starter", "Pro", "Business", "Agency"]) {
    await expect(page.getByRole("heading", { name: plan, exact: true })).toBeVisible();
  }
});

test("signup page renders (or shows config notice)", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /start review loop/i })).toBeVisible();
});

test("FAQ states no fake reviews and no auto-posting", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/does this create fake reviews\?/i)).toBeVisible();
  await expect(page.getByText(/does this auto-post replies\?/i)).toBeVisible();
});
