import { describe, it, expect } from "vitest";
import { MockAIProvider } from "@/lib/ai/providers/mock";
import { reviewAnalysisSchema } from "@/lib/ai/schemas/review-analysis";

const provider = new MockAIProvider();

const baseInput = {
  platform: "Google",
  reviewer_name: "Jamie",
  business_name: "Acme Plumbing",
  brand_tone: "professional" as const,
  business_type: "Plumbing",
};

describe("MockAIProvider.analyzeReview", () => {
  it("always returns schema-valid output", async () => {
    const out = await provider.analyzeReview({
      ...baseInput,
      rating: 5,
      review_text: "Amazing, professional and friendly. Highly recommend!",
    });
    expect(reviewAnalysisSchema.safeParse(out).success).toBe(true);
  });

  it("flags a 1-star review as negative, high severity, escalate", async () => {
    const out = await provider.analyzeReview({
      ...baseInput,
      rating: 1,
      review_text: "Terrible service, the tech was rude and late.",
    });
    expect(out.sentiment).toBe("negative");
    expect(out.should_escalate).toBe(true);
    expect(out.apology_needed).toBe(true);
    expect(out.testimonial_candidate).toBe(false);
  });

  it("marks a 5-star review as a testimonial candidate with a social post", async () => {
    const out = await provider.analyzeReview({
      ...baseInput,
      rating: 5,
      review_text: "Fantastic work, fast and tidy.",
    });
    expect(out.sentiment).toBe("positive");
    expect(out.testimonial_candidate).toBe(true);
    expect(out.social_post_draft.length).toBeGreaterThan(0);
  });

  it("infers sentiment from text when rating is unknown", async () => {
    const negative = await provider.analyzeReview({
      ...baseInput,
      rating: null,
      review_text: "Worst experience, never again.",
    });
    expect(negative.sentiment).toBe("negative");
  });

  it("never produces a reply admitting legal fault", async () => {
    const out = await provider.analyzeReview({
      ...baseInput,
      rating: 1,
      review_text: "You broke my pipe and flooded the house!",
    });
    expect(out.suggested_reply.toLowerCase()).not.toContain("legally liable");
  });
});

describe("MockAIProvider.summarize", () => {
  it("returns a non-empty summary string", async () => {
    const summary = await provider.summarize("Requests sent: 5\nAverage rating: 4.5");
    expect(summary.length).toBeGreaterThan(10);
    expect(summary).toMatch(/recommended next actions/i);
  });
});
