import { describe, it, expect } from "vitest";
import {
  reviewAnalysisSchema,
  reviewAnalysisInputSchema,
} from "@/lib/ai/schemas/review-analysis";

const validAnalysis = {
  sentiment: "positive",
  severity: "low",
  should_escalate: false,
  suggested_reply: "Thanks so much!",
  reply_tone: "friendly",
  key_points: ["fast service"],
  apology_needed: false,
  avoid_phrases: [],
  testimonial_candidate: true,
  social_post_draft: "Great review!",
  confidence: 0.9,
};

describe("reviewAnalysisSchema", () => {
  it("accepts a well-formed analysis", () => {
    const res = reviewAnalysisSchema.safeParse(validAnalysis);
    expect(res.success).toBe(true);
  });

  it("defaults optional arrays and social post", () => {
    const { key_points, avoid_phrases, social_post_draft, ...rest } = validAnalysis;
    const res = reviewAnalysisSchema.parse(rest);
    expect(res.key_points).toEqual([]);
    expect(res.avoid_phrases).toEqual([]);
    expect(res.social_post_draft).toBe("");
  });

  it("rejects an invalid sentiment", () => {
    const res = reviewAnalysisSchema.safeParse({ ...validAnalysis, sentiment: "angry" });
    expect(res.success).toBe(false);
  });

  it("rejects confidence outside 0..1", () => {
    expect(reviewAnalysisSchema.safeParse({ ...validAnalysis, confidence: 1.5 }).success).toBe(
      false,
    );
    expect(reviewAnalysisSchema.safeParse({ ...validAnalysis, confidence: -0.1 }).success).toBe(
      false,
    );
  });

  it("rejects an empty suggested reply", () => {
    expect(
      reviewAnalysisSchema.safeParse({ ...validAnalysis, suggested_reply: "" }).success,
    ).toBe(false);
  });
});

describe("reviewAnalysisInputSchema", () => {
  it("rejects ratings outside 1..5", () => {
    const base = {
      platform: "Google",
      review_text: "Great",
      business_name: "Acme",
    };
    expect(reviewAnalysisInputSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
    expect(reviewAnalysisInputSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
    expect(reviewAnalysisInputSchema.safeParse({ ...base, rating: 5 }).success).toBe(true);
    expect(reviewAnalysisInputSchema.safeParse({ ...base, rating: null }).success).toBe(true);
  });

  it("defaults brand tone to professional", () => {
    const res = reviewAnalysisInputSchema.parse({
      platform: "Google",
      rating: 5,
      review_text: "Great",
      business_name: "Acme",
    });
    expect(res.brand_tone).toBe("professional");
  });
});
