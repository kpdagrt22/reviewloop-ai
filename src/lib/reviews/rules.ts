import type { ReviewAnalysis } from "@/lib/ai/schemas/review-analysis";

/**
 * Deterministic business rules for review handling. These are intentionally
 * provider-independent: they hold whether the AI output came from mock, OpenAI,
 * or Anthropic, and they are the source of truth for compliance-sensitive
 * behavior (negative review escalation, testimonial eligibility).
 */

/** A review needs escalation if it is low-rated OR the AI flags high severity. */
export function shouldEscalate(
  rating: number | null,
  analysis?: Pick<ReviewAnalysis, "severity" | "should_escalate"> | null,
): boolean {
  if (rating !== null && rating <= 2) return true;
  if (analysis?.severity === "high") return true;
  if (analysis?.should_escalate) return true;
  return false;
}

/** A review can become a testimonial only if it is genuinely positive (>= 4). */
export function isTestimonialCandidate(
  rating: number | null,
  analysis?: Pick<ReviewAnalysis, "sentiment"> | null,
): boolean {
  if (rating !== null && rating >= 4) return true;
  // If rating is unknown, fall back to AI sentiment.
  if (rating === null && analysis?.sentiment === "positive") return true;
  return false;
}

/** Map a numeric rating to a coarse sentiment bucket (used when AI is unavailable). */
export function ratingToSentiment(
  rating: number | null,
): "positive" | "neutral" | "negative" {
  if (rating === null) return "neutral";
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

/**
 * Phrases the product must never put into an owner-facing reply draft. We strip
 * these defensively before showing a draft so we never admit legal fault or
 * make incentive offers, regardless of what a provider returns.
 */
export const PROHIBITED_REPLY_PATTERNS: RegExp[] = [
  // Explicit legal-liability / fault admissions (kept tight so normal empathy
  // like "we'll make this right" or "we take this seriously" is NOT caught).
  /\bwe are (?:legally )?liable\b/i,
  /\bthis is our fault legally\b/i,
  /\bwe (?:admit|accept) (?:full |legal )?(?:liability|fault|wrongdoing)\b/i,
  // Incentive-for-review-change offers (policy-violating quid pro quo).
  /\bfree (?:service|product|month).{0,20}\bif you (?:change|update|remove)\b/i,
  /\b(?:discount|refund|compensation|gift card|voucher).{0,40}\bif you (?:remove|change|edit|update|delete)\b.{0,20}\breview\b/i,
];

export function containsProhibitedReplyContent(text: string): boolean {
  return PROHIBITED_REPLY_PATTERNS.some((re) => re.test(text));
}
