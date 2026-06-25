import { getAIProvider } from "@/lib/ai/service";
import {
  reviewAnalysisInputSchema,
  type ReviewAnalysis,
} from "@/lib/ai/schemas/review-analysis";
import { containsProhibitedReplyContent, shouldEscalate } from "@/lib/reviews/rules";
import { hasResend, publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/messaging/email";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";

type DB = SupabaseClient<Database>;

export interface AnalyzeResult {
  analysis: ReviewAnalysis;
  draftId: string | null;
  escalated: boolean;
}

/**
 * Runs AI analysis for a stored review, then persists the side effects:
 *  - updates the review's sentiment/status
 *  - inserts an ai_reply_drafts row (pending approval)
 *  - inserts a notification_event when escalation is needed
 *  - logs the AI call to ai_review_logs (input/output/status)
 *
 * Compliance: the draft is always created in 'draft' status — never posted.
 * Prohibited content (legal fault / incentives) is stripped defensively.
 */
export async function analyzeAndPersist(
  supabase: DB,
  org: Pick<Tables<"organizations">, "id" | "name" | "brand_tone" | "business_type" | "escalation_email">,
  review: Pick<
    Tables<"reviews">,
    "id" | "platform" | "rating" | "reviewer_name" | "review_text" | "status"
  >,
): Promise<AnalyzeResult> {
  const provider = getAIProvider();

  const input = reviewAnalysisInputSchema.parse({
    platform: review.platform ?? "Google",
    rating: review.rating ?? null,
    reviewer_name: review.reviewer_name ?? "",
    review_text: review.review_text ?? "",
    business_name: org.name,
    brand_tone: (org.brand_tone as never) ?? "professional",
    business_type: org.business_type ?? "service business",
  });

  let analysis: ReviewAnalysis;
  let logStatus = "success";
  let errorMessage: string | null = null;

  try {
    analysis = await provider.analyzeReview(input);
  } catch (err) {
    // Fall back to a safe, neutral analysis so the UI never dead-ends.
    logStatus = "error";
    errorMessage = (err as Error).message;
    analysis = safeFallback(input.rating);
  }

  // Defensive scrub: never surface a draft that admits legal fault / incentives.
  let replyText = analysis.suggested_reply;
  if (containsProhibitedReplyContent(replyText)) {
    replyText =
      "Thank you for your feedback. We take this seriously and would like to make it right — " +
      "please contact us directly so we can help.";
    // Mark the log so an auditor can see the model attempted prohibited content
    // (only override a clean "success"; keep "error" if the provider failed).
    if (logStatus === "success") logStatus = "scrubbed";
  }

  // Defense in depth: also scrub the testimonial/social drafts the composer reads
  // from the stored analysis, so prohibited content can't reach those surfaces.
  if (containsProhibitedReplyContent(analysis.social_post_draft)) {
    analysis.social_post_draft = "";
    if (logStatus === "success") logStatus = "scrubbed";
  }
  if (containsProhibitedReplyContent(analysis.testimonial_text)) {
    analysis.testimonial_text = "";
    if (logStatus === "success") logStatus = "scrubbed";
  }

  const escalated = shouldEscalate(review.rating, analysis);

  // 1) Update the review row. Always refresh sentiment, but never downgrade a
  // terminal state — re-analyzing (e.g. "Regenerate") must not silently revert
  // an already-replied or archived review back to new/escalated.
  const isTerminal = review.status === "replied" || review.status === "archived";
  await supabase
    .from("reviews")
    .update({
      sentiment: analysis.sentiment,
      ...(isTerminal ? {} : { status: escalated ? "escalated" : "new" }),
    })
    .eq("id", review.id)
    .eq("organization_id", org.id);

  // 2) Insert the reply draft (pending approval).
  const { data: draft } = await supabase
    .from("ai_reply_drafts")
    .insert({
      organization_id: org.id,
      review_id: review.id,
      tone: analysis.reply_tone,
      draft_text: replyText,
      status: "draft",
      ai_confidence: analysis.confidence,
    })
    .select("id")
    .single();

  // 3) Escalation notification event + optional email alert.
  if (escalated) {
    await supabase.from("notification_events").insert({
      organization_id: org.id,
      event_type: "negative_review_detected",
      metadata: {
        review_id: review.id,
        rating: review.rating,
        severity: analysis.severity,
        reviewer_name: review.reviewer_name,
        suggested_action: "Respond professionally and consider calling the customer.",
      },
    });

    // Email the escalation address when configured (best-effort, non-blocking).
    // We include only review fields that are already public; no private CRM data.
    if (org.escalation_email && hasResend()) {
      const link = `${publicEnv.appUrl}/app/reviews/${review.id}`;
      await sendEmail({
        to: org.escalation_email,
        subject: `⚠️ Negative review needs attention — ${org.name}`,
        body: [
          `A review was flagged for ${org.name}.`,
          ``,
          `Platform: ${review.platform ?? "review"}`,
          `Rating: ${review.rating ?? "n/a"}/5`,
          `Reviewer: ${review.reviewer_name ?? "unknown"}`,
          ``,
          `Suggested action: Reply professionally and invite the customer to`,
          `resolve it offline. Consider calling them.`,
          ``,
          `Open it here: ${link}`,
        ].join("\n"),
      }).catch(() => undefined);
    }
  }

  // 4) AI call log.
  await supabase.from("ai_review_logs").insert({
    organization_id: org.id,
    review_id: review.id,
    provider: provider.name,
    model: provider.model,
    input_json: input as unknown as Record<string, unknown>,
    output_json: analysis as unknown as Record<string, unknown>,
    status: logStatus,
    error_message: errorMessage,
  });

  return { analysis, draftId: draft?.id ?? null, escalated };
}

function safeFallback(rating: number | null): ReviewAnalysis {
  const negative = rating !== null && rating <= 2;
  return {
    sentiment: negative ? "negative" : rating === 3 ? "neutral" : "positive",
    severity: negative ? "medium" : "low",
    should_escalate: negative,
    suggested_reply:
      "Thank you for your feedback. We appreciate you taking the time and would love to " +
      "make sure you're fully taken care of — please reach out to us directly.",
    reply_tone: "professional",
    key_points: [],
    apology_needed: negative,
    avoid_phrases: ["admitting legal fault", "sharing private customer details"],
    testimonial_candidate: rating !== null && rating >= 4,
    testimonial_text: "",
    social_post_draft: "",
    confidence: 0.3,
  };
}
