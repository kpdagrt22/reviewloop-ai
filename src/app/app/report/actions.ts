"use server";

import { requireOrg } from "@/lib/auth/session";
import { loadDashboard } from "@/lib/data/dashboard";
import { getAIProvider } from "@/lib/ai/service";

export interface SummaryState {
  summary?: string;
  error?: string;
}

/** Build a metrics prompt and ask the AI (mock or live) for a short summary. */
export async function generateSummaryAction(): Promise<SummaryState> {
  const org = await requireOrg();
  const { report, testimonialsReady } = await loadDashboard(org.id);

  const prompt = [
    `Business: ${org.name}`,
    `Review requests sent: ${report.requestsSent}`,
    `Requests clicked: ${report.requestsClicked}`,
    `Reviews added: ${report.reviewsAdded}`,
    `Average rating: ${report.averageRating ?? "n/a"}`,
    `Sentiment — positive: ${report.breakdown.positive}, neutral: ${report.breakdown.neutral}, negative: ${report.breakdown.negative}`,
    `Reviews needing attention: ${report.negativeNeedingAttention}`,
    `Pending reply drafts: ${report.pendingReplies}`,
    `Testimonial candidates: ${report.testimonialCandidates}`,
    `Approved testimonials: ${testimonialsReady}`,
  ].join("\n");

  try {
    const provider = getAIProvider();
    const summary = await provider.summarize(prompt);
    return { summary };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
