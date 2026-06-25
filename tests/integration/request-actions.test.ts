import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createFakeSupabase,
  findWrite,
  type FakeConfig,
  type FakeSupabase,
} from "./_supabase-mock";

/**
 * Server-action coverage for the review-request flow — the path that carries the
 * T1 fix (the 'ready' status) and the compliance gates (opt-out + consent). The
 * Supabase client, auth, and Next cache are mocked so the action runs under
 * vitest with no live services.
 *
 * Every fake is configured with `requiredFilters` so that if production code
 * ever dropped an `organization_id` scope filter, these tests would THROW rather
 * than silently pass.
 */

const requireOrg = vi.fn();
const createClient = vi.fn();

vi.mock("@/lib/auth/session", () => ({ requireOrg: () => requireOrg() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  createRequestAction,
  updateRequestStatusAction,
} from "@/app/app/requests/actions";

const org = {
  id: "org_1",
  name: "Sunshine Plumbing",
  google_review_link: "https://g.page/r/test",
  facebook_review_link: null,
  yelp_review_link: null,
  trustpilot_review_link: null,
  other_review_link: null,
  escalation_email: null,
};

// Org-scoping that production code MUST apply on these tables.
const SCOPED: FakeConfig["requiredFilters"] = {
  customers: ["organization_id"],
  review_requests: ["organization_id"],
  ai_reply_drafts: ["organization_id"],
  subscriptions: ["organization_id"],
};

function mkFake(cfg: FakeConfig): FakeSupabase {
  const fake = createFakeSupabase({ ...cfg, requiredFilters: SCOPED });
  createClient.mockResolvedValue(fake.client);
  return fake;
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireOrg.mockResolvedValue(org);
});

describe("createRequestAction", () => {
  it("refuses to record a request for an opted-out customer", async () => {
    const fake = mkFake({
      reads: {
        customers: { id: "c1", name: "Jane", opt_out: true, email: null, phone: null },
        subscriptions: null,
      },
    });

    const res = await createRequestAction({}, form({ customerId: "c1", channel: "manual", stage: "ready" }));

    expect(res.error).toMatch(/opted out/i);
    // Compliance: we never even create a request row for an opted-out customer.
    expect(findWrite(fake, "review_requests")).toBeUndefined();
  });

  it("rejects an unsupported channel", async () => {
    mkFake({ reads: { subscriptions: null } });

    const res = await createRequestAction({}, form({ customerId: "c1", channel: "carrier-pigeon" }));

    expect(res.error).toMatch(/channel/i);
  });

  it("blocks an email request without email consent", async () => {
    mkFake({
      reads: {
        customers: {
          id: "c1",
          name: "Jane",
          opt_out: false,
          email: "jane@example.com",
          phone: null,
          consent_email: false,
          consent_sms: false,
        },
        subscriptions: null,
      },
    });

    const res = await createRequestAction({}, form({ customerId: "c1", channel: "email", stage: "send" }));

    expect(res.error).toMatch(/consent/i);
  });

  it("stages a manual request as 'ready', scoped to the org, and reports success", async () => {
    const fake = mkFake({
      reads: {
        customers: {
          id: "c1",
          name: "Jane",
          opt_out: false,
          email: "jane@example.com",
          phone: "+15555550123",
          consent_email: true,
          consent_sms: true,
        },
        subscriptions: null,
      },
      inserted: { review_requests: { id: "req_1" } },
    });

    const res = await createRequestAction({}, form({ customerId: "c1", channel: "manual", stage: "ready" }));

    expect(res.ok).toBe(true);
    expect(res.message).toMatch(/ready/i);
    expect(findWrite(fake, "review_requests", "insert")).toBeDefined();
    const update = findWrite(fake, "review_requests", "update");
    expect((update?.payload as Record<string, unknown>).status).toBe("ready");
    // The status update must be scoped to the org (defense in depth + multi-tenant).
    expect(update?.filters).toContainEqual(["organization_id", "org_1"]);
  });

  it("surfaces a DB error on the 'ready' write instead of faking success", async () => {
    mkFake({
      reads: {
        customers: {
          id: "c1",
          name: "Jane",
          opt_out: false,
          email: "jane@example.com",
          phone: "+15555550123",
          consent_email: true,
          consent_sms: true,
        },
        subscriptions: null,
      },
      inserted: { review_requests: { id: "req_1" } },
      errors: { "review_requests:update": { message: "check constraint violated" } },
    });

    const res = await createRequestAction({}, form({ customerId: "c1", channel: "manual", stage: "ready" }));

    expect(res.ok).toBeUndefined();
    expect(res.error).toMatch(/constraint/i);
  });
});

describe("updateRequestStatusAction", () => {
  it("throws on an illegal transition (completed -> draft)", async () => {
    const fake = mkFake({});

    await expect(
      updateRequestStatusAction(form({ requestId: "req_1", from: "completed", to: "draft" })),
    ).rejects.toThrow(/transition/i);
    expect(findWrite(fake, "review_requests", "update")).toBeUndefined();
  });

  it("advances a legal transition, stamps the timestamp, and stays org-scoped", async () => {
    const fake = mkFake({});

    await updateRequestStatusAction(form({ requestId: "req_1", from: "sent", to: "completed" }));

    const update = findWrite(fake, "review_requests", "update");
    const payload = update?.payload as Record<string, unknown>;
    expect(payload.status).toBe("completed");
    expect(payload.completed_at).toBeDefined();
    expect(update?.filters).toContainEqual(["organization_id", "org_1"]);
  });
});
