import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFakeSupabase } from "./_supabase-mock";

/**
 * Quota enforcement (T8). The rule is SOFT: limits only block when real Stripe
 * billing is configured (STRIPE_SECRET_KEY present). hasStripe() reads the env
 * at call time, so we toggle the var directly rather than mocking the module.
 */

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));

import { checkReviewRequestQuota } from "@/lib/billing/usage";

const STRIPE = "STRIPE_SECRET_KEY";

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env[STRIPE];
});
afterEach(() => {
  delete process.env[STRIPE];
});

describe("checkReviewRequestQuota", () => {
  it("does NOT block when Stripe is unconfigured, even over the limit (soft)", async () => {
    createClient.mockResolvedValue(
      createFakeSupabase({ counts: { review_requests: 9999 }, reads: { subscriptions: null } }).client,
    );

    const res = await checkReviewRequestQuota("org_1");

    expect(res.used).toBe(9999);
    expect(res.plan).toBe("starter");
    expect(res.enforced).toBe(false);
    expect(res.allowed).toBe(true);
  });

  it("blocks when Stripe IS configured and the org is over quota (hard)", async () => {
    process.env[STRIPE] = "sk_test_dummy";
    createClient.mockResolvedValue(
      createFakeSupabase({ counts: { review_requests: 9999 }, reads: { subscriptions: null } }).client,
    );

    const res = await checkReviewRequestQuota("org_1");

    expect(res.enforced).toBe(true);
    expect(res.allowed).toBe(false);
    expect(res.reason).toMatch(/limit/i);
  });

  it("allows a configured org that is under quota", async () => {
    process.env[STRIPE] = "sk_test_dummy";
    createClient.mockResolvedValue(
      createFakeSupabase({ counts: { review_requests: 3 }, reads: { subscriptions: null } }).client,
    );

    const res = await checkReviewRequestQuota("org_1");

    expect(res.allowed).toBe(true);
    expect(res.enforced).toBe(false);
  });
});
