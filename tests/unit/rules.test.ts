import { describe, it, expect } from "vitest";
import {
  shouldEscalate,
  isTestimonialCandidate,
  ratingToSentiment,
  containsProhibitedReplyContent,
} from "@/lib/reviews/rules";

describe("shouldEscalate", () => {
  it("escalates low ratings (<= 2)", () => {
    expect(shouldEscalate(1, null)).toBe(true);
    expect(shouldEscalate(2, null)).toBe(true);
  });

  it("does not escalate 3+ ratings without AI signal", () => {
    expect(shouldEscalate(3, null)).toBe(false);
    expect(shouldEscalate(5, null)).toBe(false);
  });

  it("escalates when AI marks high severity even with no rating", () => {
    expect(shouldEscalate(null, { severity: "high", should_escalate: false })).toBe(true);
  });

  it("escalates when AI sets should_escalate", () => {
    expect(shouldEscalate(4, { severity: "low", should_escalate: true })).toBe(true);
  });

  it("does not escalate a clean positive review", () => {
    expect(shouldEscalate(5, { severity: "low", should_escalate: false })).toBe(false);
  });
});

describe("isTestimonialCandidate", () => {
  it("is true for 4 and 5 star reviews", () => {
    expect(isTestimonialCandidate(4, null)).toBe(true);
    expect(isTestimonialCandidate(5, null)).toBe(true);
  });

  it("is false for 3 stars and below", () => {
    expect(isTestimonialCandidate(3, null)).toBe(false);
    expect(isTestimonialCandidate(1, null)).toBe(false);
  });

  it("falls back to AI sentiment when rating is unknown", () => {
    expect(isTestimonialCandidate(null, { sentiment: "positive" })).toBe(true);
    expect(isTestimonialCandidate(null, { sentiment: "negative" })).toBe(false);
  });
});

describe("ratingToSentiment", () => {
  it("maps ratings to buckets", () => {
    expect(ratingToSentiment(5)).toBe("positive");
    expect(ratingToSentiment(4)).toBe("positive");
    expect(ratingToSentiment(3)).toBe("neutral");
    expect(ratingToSentiment(2)).toBe("negative");
    expect(ratingToSentiment(null)).toBe("neutral");
  });
});

describe("containsProhibitedReplyContent", () => {
  it("flags admissions of legal liability", () => {
    expect(containsProhibitedReplyContent("Honestly, we are legally liable here.")).toBe(true);
  });

  it("flags incentive-for-edit offers", () => {
    expect(
      containsProhibitedReplyContent("We'll give you a free month if you change your review."),
    ).toBe(true);
    expect(
      containsProhibitedReplyContent("Here's a discount if you update your review for us."),
    ).toBe(true);
  });

  it("flags explicit liability / fault admissions", () => {
    expect(containsProhibitedReplyContent("We admit full liability for this.")).toBe(true);
    expect(containsProhibitedReplyContent("We accept fault here.")).toBe(true);
  });

  it("does NOT flag normal empathy / good service language", () => {
    // These are good replies and must not be scrubbed.
    expect(containsProhibitedReplyContent("We're sorry and we'll make this right.")).toBe(false);
    expect(
      containsProhibitedReplyContent("We take full responsibility for your experience."),
    ).toBe(false);
    expect(containsProhibitedReplyContent("That was our mistake — please reach out.")).toBe(false);
  });

  it("passes a normal professional reply", () => {
    expect(
      containsProhibitedReplyContent("Thank you for your feedback, we'd love to make it right."),
    ).toBe(false);
  });
});
