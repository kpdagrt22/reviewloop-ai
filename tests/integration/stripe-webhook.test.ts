import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { createFakeSupabase, findWrite } from "./_supabase-mock";

/**
 * Coverage for the Stripe webhook persistence + error handling (T8). Stripe's SDK
 * and the service-role client are mocked; we assert the subscription row is
 * written and that a DB failure returns 500 so Stripe retries (no silent drop).
 */

const constructEvent = vi.fn();
const createAdminClient = vi.fn();

vi.mock("@/lib/billing/stripe", () => ({
  getStripe: async () => ({
    webhooks: { constructEvent: (...a: unknown[]) => constructEvent(...a) },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClient() }));

import { POST } from "@/app/api/stripe/webhook/route";

process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
afterAll(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

function req(): Request {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "sig_test" },
    body: "{}",
  });
}

const checkoutEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      metadata: { organization_id: "org_1", plan: "pro" },
      customer: "cus_1",
      subscription: "sub_1",
    },
  },
};

const updatedEvent = {
  type: "customer.subscription.updated",
  data: { object: { id: "sub_1", status: "active", current_period_end: 1893456000 } },
};

beforeEach(() => vi.clearAllMocks());

describe("POST /api/stripe/webhook", () => {
  it("upserts the subscription on checkout.session.completed", async () => {
    constructEvent.mockReturnValue(checkoutEvent);
    const fake = createFakeSupabase();
    createAdminClient.mockReturnValue(fake.client);

    const res = await POST(req());

    expect(res.status).toBe(200);
    const w = findWrite(fake, "subscriptions", "upsert");
    expect(w).toBeDefined();
    const payload = w?.payload as Record<string, unknown>;
    expect(payload.organization_id).toBe("org_1");
    expect(payload.plan).toBe("pro");
    expect(payload.status).toBe("active");
  });

  it("returns 500 when the upsert fails so Stripe retries", async () => {
    constructEvent.mockReturnValue(checkoutEvent);
    const fake = createFakeSupabase({ errors: { "subscriptions:upsert": { message: "db down" } } });
    createAdminClient.mockReturnValue(fake.client);

    const res = await POST(req());

    expect(res.status).toBe(500);
  });

  it("updates the subscription status on customer.subscription.updated", async () => {
    constructEvent.mockReturnValue(updatedEvent);
    const fake = createFakeSupabase();
    createAdminClient.mockReturnValue(fake.client);

    const res = await POST(req());

    expect(res.status).toBe(200);
    expect((findWrite(fake, "subscriptions", "update")?.payload as Record<string, unknown>).status).toBe(
      "active",
    );
  });

  it("returns 500 when the status update fails", async () => {
    constructEvent.mockReturnValue(updatedEvent);
    const fake = createFakeSupabase({ errors: { "subscriptions:update": { message: "db down" } } });
    createAdminClient.mockReturnValue(fake.client);

    const res = await POST(req());

    expect(res.status).toBe(500);
  });
});
