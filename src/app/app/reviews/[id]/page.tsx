import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, ratingTone, sentimentTone } from "@/components/ui/badge";
import { ReplyEditor } from "./reply-editor";
import { TestimonialComposer } from "./testimonial-composer";
import { reviewAnalysisSchema, type ReviewAnalysis } from "@/lib/ai/schemas/review-analysis";
import { isTestimonialCandidate, shouldEscalate } from "@/lib/reviews/rules";

export const metadata = { title: "Review — ReviewLoop AI" };

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!review) notFound();

  const [{ data: drafts }, { data: logs }] = await Promise.all([
    supabase
      .from("ai_reply_drafts")
      .select("*")
      .eq("review_id", id)
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_review_logs")
      .select("output_json, provider, model, status")
      .eq("review_id", id)
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const latestDraft =
    drafts?.find((d) => d.status === "draft") ?? drafts?.[0] ?? null;
  const posted = drafts?.some((d) => d.status === "posted") ?? false;

  // Best-effort parse of the stored AI analysis.
  let analysis: ReviewAnalysis | null = null;
  const raw = logs?.[0]?.output_json;
  if (raw) {
    const parsed = reviewAnalysisSchema.safeParse(raw);
    if (parsed.success) analysis = parsed.data;
  }

  const escalated = shouldEscalate(review.rating, analysis);
  const canTestimonial = isTestimonialCandidate(review.rating, analysis);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/app/reviews" className="text-sm text-brand-600 hover:underline">
        ← All reviews
      </Link>

      {/* Original review */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {review.reviewer_name || "Anonymous"}
            </h1>
            <span className="text-sm text-gray-400">{review.platform}</span>
            {review.rating != null ? (
              <Badge tone={ratingTone(review.rating)}>{review.rating}★</Badge>
            ) : null}
            {review.sentiment ? (
              <Badge tone={sentimentTone(review.sentiment)}>{review.sentiment}</Badge>
            ) : null}
            {escalated ? <Badge tone="red">Needs attention</Badge> : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-gray-700">{review.review_text}</p>
          {review.review_url ? (
            <a
              href={review.review_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-brand-600 hover:underline"
            >
              View original →
            </a>
          ) : null}
        </div>
      </div>

      {/* Escalation alert */}
      {escalated ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">This review needs attention.</p>
          <p className="mt-1 text-sm text-red-700">
            Respond professionally, acknowledge the concern, and invite the customer to resolve
            it offline. Consider calling them.
            {org.escalation_email
              ? ` Escalation contact: ${org.escalation_email}.`
              : ""}
          </p>
        </div>
      ) : null}

      {/* AI analysis */}
      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-gray-900">AI analysis</h2>
          {analysis ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Analysis label="Sentiment" value={analysis.sentiment} />
              <Analysis label="Severity" value={analysis.severity} />
              <Analysis label="Apology needed" value={analysis.apology_needed ? "Yes" : "No"} />
              <Analysis
                label="Confidence"
                value={`${Math.round(analysis.confidence * 100)}%`}
              />
              {analysis.key_points.length > 0 ? (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Key points</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-gray-700">
                    {analysis.key_points.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {analysis.avoid_phrases.length > 0 ? (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Avoid</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {analysis.avoid_phrases.join(" · ")}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              No analysis stored. Use “Regenerate” below to analyze this review.
            </p>
          )}
        </div>
      </div>

      {/* Reply draft */}
      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-gray-900">Reply draft</h2>
          <p className="mb-3 text-sm text-gray-500">
            Edit as needed, copy it, then post it on the platform yourself.
          </p>
          <ReplyEditor
            reviewId={review.id}
            draftId={latestDraft?.id ?? null}
            initialText={latestDraft?.draft_text ?? ""}
            posted={posted}
          />
        </div>
      </div>

      {/* Testimonial / social — positive reviews only */}
      {canTestimonial ? (
        <div className="card border-green-200">
          <div className="card-body">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Turn this into proof</h2>
              <Badge tone="green">Positive review</Badge>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              Reuse this happy review as a testimonial or social post.
            </p>
            <TestimonialComposer
              reviewId={review.id}
              defaultQuote={review.review_text ?? ""}
              defaultName={review.reviewer_name ?? ""}
              defaultServiceType={review.platform ?? ""}
              defaultSocialPost={analysis?.social_post_draft || buildFallbackPost(review, org.name)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Analysis({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium capitalize text-gray-900">{value}</p>
    </div>
  );
}

function buildFallbackPost(
  review: { review_text: string | null; reviewer_name: string | null },
  businessName: string,
): string {
  const name = review.reviewer_name || "A happy customer";
  const text = (review.review_text ?? "").slice(0, 180);
  return `⭐⭐⭐⭐⭐ "${text}"\n— ${name}\n\nThank you for trusting ${businessName}!`;
}
