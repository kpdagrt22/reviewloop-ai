import { isTestimonialCandidate, shouldEscalate } from "@/lib/reviews/rules";

export interface ReportReview {
  rating: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  severity?: "low" | "medium" | "high" | null;
  should_escalate?: boolean | null;
}

export interface ReportRequest {
  status: string;
}

export interface ReportDraft {
  status: string; // 'draft' | 'approved' | 'posted'
}

export interface WeeklyReport {
  requestsSent: number;
  requestsClicked: number;
  reviewsAdded: number;
  averageRating: number | null;
  breakdown: { positive: number; neutral: number; negative: number };
  /** Count of reviews per star rating, 1..5. */
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  pendingReplies: number;
  negativeNeedingAttention: number;
  testimonialCandidates: number;
  recommendedActions: string[];
}

/**
 * Pure report calculator. Given the raw rows for a period it computes every
 * headline number the weekly report and dashboard show. No DB access here so it
 * is trivially unit-testable.
 */
export function computeWeeklyReport(input: {
  requests: ReportRequest[];
  reviews: ReportReview[];
  drafts: ReportDraft[];
}): WeeklyReport {
  const { requests, reviews, drafts } = input;

  const requestsSent = requests.filter((r) =>
    ["sent", "clicked", "completed"].includes(r.status),
  ).length;
  const requestsClicked = requests.filter((r) =>
    ["clicked", "completed"].includes(r.status),
  ).length;

  const rated = reviews.filter((r) => typeof r.rating === "number");
  const averageRating =
    rated.length === 0
      ? null
      : Math.round(
          (rated.reduce((sum, r) => sum + (r.rating as number), 0) / rated.length) * 10,
        ) / 10;

  const breakdown = { positive: 0, neutral: 0, negative: 0 };
  for (const r of reviews) {
    const s = r.sentiment ?? "neutral";
    breakdown[s] += 1;
  }

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    if (typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
    }
  }

  const negativeNeedingAttention = reviews.filter((r) =>
    shouldEscalate(r.rating, {
      severity: r.severity ?? "low",
      should_escalate: r.should_escalate ?? false,
    }),
  ).length;

  const testimonialCandidates = reviews.filter((r) =>
    isTestimonialCandidate(r.rating, { sentiment: r.sentiment ?? "neutral" }),
  ).length;

  const pendingReplies = drafts.filter((d) => d.status === "draft").length;

  return {
    requestsSent,
    requestsClicked,
    reviewsAdded: reviews.length,
    averageRating,
    breakdown,
    ratingDistribution,
    pendingReplies,
    negativeNeedingAttention,
    testimonialCandidates,
    recommendedActions: buildRecommendations({
      requestsSent,
      pendingReplies,
      negativeNeedingAttention,
      testimonialCandidates,
    }),
  };
}

function buildRecommendations(m: {
  requestsSent: number;
  pendingReplies: number;
  negativeNeedingAttention: number;
  testimonialCandidates: number;
}): string[] {
  const actions: string[] = [];
  if (m.negativeNeedingAttention > 0) {
    actions.push(
      `Respond to ${m.negativeNeedingAttention} review(s) needing attention and consider calling the customer.`,
    );
  }
  if (m.pendingReplies > 0) {
    actions.push(`Review and approve ${m.pendingReplies} pending reply draft(s).`);
  }
  if (m.testimonialCandidates > 0) {
    actions.push(
      `Turn ${m.testimonialCandidates} positive review(s) into testimonials or social posts.`,
    );
  }
  if (m.requestsSent === 0) {
    actions.push("Send review requests to customers you served this week.");
  }
  if (actions.length === 0) {
    actions.push("You're all caught up — keep collecting reviews from happy customers.");
  }
  return actions;
}
