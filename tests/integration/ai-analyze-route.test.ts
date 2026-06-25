import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Coverage for the /api/ai/analyze route guard + best-effort rate limiter (T13).
 * The mock AI provider (default with no key) handles analysis, so no live calls.
 */

const getActiveOrg = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getActiveOrg: () => getActiveOrg() }));

import { POST } from "@/app/api/ai/analyze/route";

function req(body: object): Request {
  return new Request("http://localhost/api/ai/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getActiveOrg.mockResolvedValue({
    id: "rl_org",
    name: "Acme",
    brand_tone: "professional",
    business_type: "Plumbing",
  });
});

describe("POST /api/ai/analyze", () => {
  it("rejects an unauthenticated request with 401", async () => {
    getActiveOrg.mockResolvedValueOnce(null);
    const res = await POST(req({ rating: 5, review_text: "Great", platform: "Google" }));
    expect(res.status).toBe(401);
  });

  it("rate-limits a single org after the per-window maximum", async () => {
    const body = { rating: 5, review_text: "Great service, on time", platform: "Google" };
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await POST(req(body));
      statuses.push(res.status);
    }
    // The first 30 are allowed; the 31st within the window is limited.
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});
