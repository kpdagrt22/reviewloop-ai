import { describe, it, expect } from "vitest";
import { computeWeeklyReport } from "@/lib/reports/weekly";

describe("computeWeeklyReport", () => {
  it("counts sent and clicked requests by status", () => {
    const report = computeWeeklyReport({
      requests: [
        { status: "draft" },
        { status: "sent" },
        { status: "clicked" },
        { status: "completed" },
        { status: "cancelled" },
      ],
      reviews: [],
      drafts: [],
    });
    // sent + clicked + completed = 3
    expect(report.requestsSent).toBe(3);
    // clicked + completed = 2
    expect(report.requestsClicked).toBe(2);
  });

  it("computes average rating rounded to one decimal", () => {
    const report = computeWeeklyReport({
      requests: [],
      reviews: [
        { rating: 5, sentiment: "positive" },
        { rating: 4, sentiment: "positive" },
        { rating: 2, sentiment: "negative" },
      ],
      drafts: [],
    });
    expect(report.averageRating).toBeCloseTo(3.7, 5);
    expect(report.reviewsAdded).toBe(3);
  });

  it("returns null average when there are no rated reviews", () => {
    const report = computeWeeklyReport({
      requests: [],
      reviews: [{ rating: null, sentiment: "neutral" }],
      drafts: [],
    });
    expect(report.averageRating).toBeNull();
  });

  it("builds a sentiment breakdown", () => {
    const report = computeWeeklyReport({
      requests: [],
      reviews: [
        { rating: 5, sentiment: "positive" },
        { rating: 3, sentiment: "neutral" },
        { rating: 1, sentiment: "negative" },
        { rating: 4, sentiment: "positive" },
      ],
      drafts: [],
    });
    expect(report.breakdown).toEqual({ positive: 2, neutral: 1, negative: 1 });
  });

  it("builds a 1..5 rating distribution and ignores null ratings", () => {
    const report = computeWeeklyReport({
      requests: [],
      reviews: [
        { rating: 5, sentiment: "positive" },
        { rating: 5, sentiment: "positive" },
        { rating: 4, sentiment: "positive" },
        { rating: 1, sentiment: "negative" },
        { rating: null, sentiment: "neutral" },
      ],
      drafts: [],
    });
    expect(report.ratingDistribution).toEqual({ 1: 1, 2: 0, 3: 0, 4: 1, 5: 2 });
  });

  it("counts negatives needing attention and testimonial candidates", () => {
    const report = computeWeeklyReport({
      requests: [],
      reviews: [
        { rating: 1, sentiment: "negative" },
        { rating: 5, sentiment: "positive" },
        { rating: 4, sentiment: "positive" },
      ],
      drafts: [],
    });
    expect(report.negativeNeedingAttention).toBe(1);
    expect(report.testimonialCandidates).toBe(2);
  });

  it("counts only pending (draft) replies", () => {
    const report = computeWeeklyReport({
      requests: [],
      reviews: [],
      drafts: [{ status: "draft" }, { status: "approved" }, { status: "posted" }],
    });
    expect(report.pendingReplies).toBe(1);
  });

  it("recommends sending requests when none were sent", () => {
    const report = computeWeeklyReport({ requests: [], reviews: [], drafts: [] });
    expect(report.recommendedActions.join(" ")).toMatch(/send review requests/i);
  });
});
