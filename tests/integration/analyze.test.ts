import { describe, it, expect } from "vitest";
import { analyzeAndPersist } from "@/lib/reviews/analyze";
import { createFakeSupabase, asSupabase, findWrite } from "./_supabase-mock";

/**
 * Integration coverage for analyzeAndPersist — the compliance-critical heart of
 * the app. Uses the deterministic mock AI provider (default when no API key) and
 * the in-memory Supabase fake, so it runs in CI with no live services.
 */

const org = {
  id: "org_1",
  name: "Sunshine Plumbing",
  brand_tone: "professional",
  business_type: "Plumbing",
  escalation_email: null,
};

function payloadOf(write: ReturnType<typeof findWrite>): Record<string, unknown> {
  return (write?.payload ?? {}) as Record<string, unknown>;
}

describe("analyzeAndPersist", () => {
  it("creates a draft (pending approval) and escalates a 1-star review", async () => {
    const fake = createFakeSupabase({ inserted: { ai_reply_drafts: { id: "draft_1" } } });
    const review = {
      id: "rev_1",
      platform: "Google",
      rating: 1,
      reviewer_name: "Bob",
      review_text: "Terrible experience, never again.",
      status: "new",
    };

    const result = await analyzeAndPersist(asSupabase(fake), org, review);

    expect(result.escalated).toBe(true);
    expect(result.draftId).toBe("draft_1");

    // Draft is always created in 'draft' status — never auto-posted.
    const draft = findWrite(fake, "ai_reply_drafts", "insert");
    expect(payloadOf(draft).status).toBe("draft");

    // Review row updated to escalated; escalation event + AI log written.
    expect(payloadOf(findWrite(fake, "reviews", "update")).status).toBe("escalated");
    expect(findWrite(fake, "notification_events", "insert")).toBeDefined();
    expect(findWrite(fake, "ai_review_logs", "insert")).toBeDefined();
  });

  it("does not escalate a 5-star review and flags a testimonial candidate", async () => {
    const fake = createFakeSupabase({ inserted: { ai_reply_drafts: { id: "draft_2" } } });
    const review = {
      id: "rev_2",
      platform: "Google",
      rating: 5,
      reviewer_name: "Amy",
      review_text: "Fantastic work, the team was on time and very professional!",
      status: "new",
    };

    const result = await analyzeAndPersist(asSupabase(fake), org, review);

    expect(result.escalated).toBe(false);
    expect(result.analysis.testimonial_candidate).toBe(true);
    expect(findWrite(fake, "notification_events", "insert")).toBeUndefined();
    // Review row stays in the active queue (not escalated).
    expect(payloadOf(findWrite(fake, "reviews", "update")).status).toBe("new");
  });

  it("never persists a reply that admits legal fault (defensive scrub)", async () => {
    const fake = createFakeSupabase({ inserted: { ai_reply_drafts: { id: "draft_3" } } });
    const review = {
      id: "rev_3",
      platform: "Google",
      rating: 2,
      reviewer_name: "Sam",
      review_text: "Showed up late and the sink still leaks.",
      status: "new",
    };

    await analyzeAndPersist(asSupabase(fake), org, review);

    const draftText = String(payloadOf(findWrite(fake, "ai_reply_drafts", "insert")).draft_text);
    expect(draftText).not.toMatch(/legally liable|admit.*(fault|liability)/i);
    expect(draftText.length).toBeGreaterThan(0);
  });

  it("does not downgrade an already-replied review when re-analyzed", async () => {
    const fake = createFakeSupabase({ inserted: { ai_reply_drafts: { id: "draft_4" } } });
    const review = {
      id: "rev_4",
      platform: "Google",
      rating: 1,
      reviewer_name: "Dana",
      review_text: "Bad.",
      status: "replied",
    };

    await analyzeAndPersist(asSupabase(fake), org, review);

    // Terminal status must not be reverted to escalated/new on re-run.
    const update = payloadOf(findWrite(fake, "reviews", "update"));
    expect(update.status).toBeUndefined();
    expect(update.sentiment).toBeDefined();
  });
});
