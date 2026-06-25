"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { reviewSchema } from "@/lib/validation/schemas";
import { analyzeAndPersist } from "@/lib/reviews/analyze";
import { ratingToSentiment } from "@/lib/reviews/rules";

export interface ReviewFormState {
  error?: string;
}

const str = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());

/** Capture a pasted review, then run AI analysis and create a reply draft. */
export async function createReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const org = await requireOrg();
  const ratingRaw = str(formData.get("rating"));
  const parsed = reviewSchema.safeParse({
    platform: str(formData.get("platform")) || "Google",
    rating: ratingRaw === "" ? null : Number(ratingRaw),
    reviewerName: str(formData.get("reviewerName")),
    reviewText: str(formData.get("reviewText")),
    reviewUrl: str(formData.get("reviewUrl")),
    reviewDate: str(formData.get("reviewDate")),
    customerId: str(formData.get("customerId")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;
  const supabase = await createClient();

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      organization_id: org.id,
      customer_id: d.customerId || null,
      platform: d.platform,
      rating: d.rating ?? null,
      reviewer_name: d.reviewerName || null,
      review_text: d.reviewText,
      review_url: d.reviewUrl || null,
      review_date: d.reviewDate || null,
      sentiment: ratingToSentiment(d.rating ?? null),
      status: "new",
    })
    .select("id, platform, rating, reviewer_name, review_text, status")
    .single();

  if (error || !review) {
    return { error: error?.message ?? "Could not save the review." };
  }

  // Run AI analysis (mock or live) and persist the draft + side effects.
  await analyzeAndPersist(supabase, org, review);

  revalidatePath("/app/reviews");
  redirect(`/app/reviews/${review.id}`);
}

/** Re-run AI analysis, replacing the prior draft. */
export async function regenerateReplyAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const reviewId = str(formData.get("reviewId"));
  if (!reviewId) return;

  const supabase = await createClient();
  const { data: review } = await supabase
    .from("reviews")
    .select("id, platform, rating, reviewer_name, review_text, status")
    .eq("id", reviewId)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!review) return;

  // Discard previous drafts so the latest is unambiguous.
  await supabase
    .from("ai_reply_drafts")
    .update({ status: "discarded" })
    .eq("review_id", reviewId)
    .eq("organization_id", org.id)
    .eq("status", "draft");

  await analyzeAndPersist(supabase, org, review);
  revalidatePath(`/app/reviews/${reviewId}`);
}

/** Save an edited reply draft. */
export async function saveDraftAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const draftId = str(formData.get("draftId"));
  const text = str(formData.get("draftText"));
  if (!draftId) return;

  const supabase = await createClient();
  await supabase
    .from("ai_reply_drafts")
    .update({ draft_text: text })
    .eq("id", draftId)
    .eq("organization_id", org.id);
  revalidatePath("/app/reviews");
}

/** Owner approved + posted the reply themselves: mark it posted. */
export async function markPostedAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const draftId = str(formData.get("draftId"));
  const reviewId = str(formData.get("reviewId"));
  if (!draftId) return;

  const supabase = await createClient();
  await supabase
    .from("ai_reply_drafts")
    .update({ status: "posted" })
    .eq("id", draftId)
    .eq("organization_id", org.id);
  if (reviewId) {
    await supabase
      .from("reviews")
      .update({ status: "replied" })
      .eq("id", reviewId)
      .eq("organization_id", org.id);
  }
  revalidatePath(`/app/reviews/${reviewId}`);
}

/** Create a testimonial draft from a (positive) review. */
export async function createTestimonialAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const reviewId = str(formData.get("reviewId"));
  const quote = str(formData.get("quote"));
  const displayName = str(formData.get("displayName"));
  const serviceType = str(formData.get("serviceType"));
  if (!reviewId || !quote) return;

  const supabase = await createClient();
  await supabase.from("testimonials").insert({
    organization_id: org.id,
    review_id: reviewId,
    quote_text: quote,
    customer_display_name: displayName || null,
    service_type: serviceType || null,
    approved: false,
  });
  revalidatePath(`/app/reviews/${reviewId}`);
  revalidatePath("/app/testimonials");
}

/** Create a social post draft from a review. */
export async function createSocialPostAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const reviewId = str(formData.get("reviewId"));
  const platform = str(formData.get("platform")) || "facebook";
  const text = str(formData.get("postText"));
  if (!reviewId || !text) return;

  const supabase = await createClient();
  await supabase.from("social_posts").insert({
    organization_id: org.id,
    review_id: reviewId,
    platform,
    post_text: text,
    status: "draft",
  });
  revalidatePath(`/app/reviews/${reviewId}`);
}
