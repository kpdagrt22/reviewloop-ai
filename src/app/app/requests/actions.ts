"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { canMessage } from "@/lib/messaging/eligibility";
import { renderDefaultRequest } from "@/lib/messaging/templates";
import { sendEmail } from "@/lib/messaging/email";
import { sendSms } from "@/lib/messaging/sms";
import { assertTransition, type RequestStatus } from "@/lib/reviews/request-status";
import { checkReviewRequestQuota } from "@/lib/billing/usage";

export interface RequestActionState {
  error?: string;
  ok?: boolean;
  message?: string;
}

const str = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());

/** Best review link to use for an org (Google preferred, then the rest). */
function reviewLinkFor(org: {
  google_review_link: string | null;
  facebook_review_link: string | null;
  yelp_review_link?: string | null;
  trustpilot_review_link?: string | null;
  other_review_link: string | null;
}): string {
  return (
    org.google_review_link ||
    org.facebook_review_link ||
    org.yelp_review_link ||
    org.trustpilot_review_link ||
    org.other_review_link ||
    ""
  );
}

/**
 * Records a review request. For channel "manual" it is logged as sent (the
 * owner copies the message themselves). For email/sms it checks consent + opt
 * out, then attempts delivery via the configured (or mock) provider.
 */
export async function createRequestAction(
  _prev: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const org = await requireOrg();
  const customerId = str(formData.get("customerId"));
  const channel = (str(formData.get("channel")) || "manual") as
    | "manual"
    | "email"
    | "sms";
  // "send" (default) advances to sent; "ready" stages the request without sending.
  const stage = str(formData.get("stage")) === "ready" ? "ready" : "send";

  if (!customerId) return { error: "Pick a customer first." };

  const link = reviewLinkFor(org);
  if (!link) {
    return { error: "Add a review link in Settings before sending requests." };
  }

  // Soft monthly plan limit (only blocks when real billing is configured).
  const quota = await checkReviewRequestQuota(org.id);
  if (!quota.allowed) {
    return { error: quota.reason ?? "Monthly review request limit reached." };
  }

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!customer) return { error: "Customer not found." };

  // Opt-out is channel-independent and enforced on the server (the disabled UI
  // button is not a security boundary — a server action is a public endpoint).
  // We never even record a request against an opted-out customer.
  if (customer.opt_out) {
    return { error: "This customer has opted out and cannot be contacted." };
  }

  const { subject, body } = renderDefaultRequest({
    customerName: customer.name,
    businessName: org.name,
    reviewLink: link,
  });

  // Channel-specific consent gating (email/SMS require explicit consent).
  if (channel !== "manual") {
    const eligibility = canMessage(customer, channel);
    if (!eligibility.eligible) {
      return { error: eligibility.reason ?? "Customer cannot be messaged on this channel." };
    }
  }

  // Create the request row first (draft), then attempt send.
  const { data: request, error: insErr } = await supabase
    .from("review_requests")
    .insert({
      organization_id: org.id,
      customer_id: customer.id,
      channel,
      status: "draft",
      request_url: link,
    })
    .select("id")
    .single();
  if (insErr || !request) return { error: insErr?.message ?? "Could not create request." };

  // Stage only: leave the request as "ready" to send later, don't deliver now.
  if (stage === "ready") {
    const { error: readyErr } = await supabase
      .from("review_requests")
      .update({ status: "ready" })
      .eq("id", request.id)
      .eq("organization_id", org.id);
    if (readyErr) return { error: readyErr.message || "Could not save the request as ready." };
    revalidatePath("/app/requests");
    return { ok: true, message: "Saved as ready to send." };
  }

  let deliveryNote = "Message ready to copy and send manually.";
  if (channel === "email") {
    const res = await sendEmail({
      to: customer.email!,
      subject,
      body,
      replyTo: org.escalation_email ?? undefined,
    });
    if (!res.ok) return { error: res.error ?? "Email failed to send." };
    deliveryNote = res.via === "mock" ? "Logged (email mock — no Resend key)." : "Email sent.";
  } else if (channel === "sms") {
    const res = await sendSms({ to: customer.phone!, body });
    if (!res.ok) return { error: res.error ?? "SMS failed to send." };
    deliveryNote = res.via === "mock" ? "Logged (SMS mock — no Twilio key)." : "SMS sent.";
  }

  // Mark as sent. The message may already have been delivered above, so if the
  // status write fails we surface it honestly rather than reporting success.
  const { error: sentErr } = await supabase
    .from("review_requests")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", request.id)
    .eq("organization_id", org.id);
  if (sentErr) {
    return { error: sentErr.message || "Could not update the request status." };
  }

  revalidatePath("/app/requests");
  return { ok: true, message: deliveryNote };
}

/** Advance a request's status, validating the transition. */
export async function updateRequestStatusAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const id = str(formData.get("requestId"));
  const from = str(formData.get("from")) as RequestStatus;
  const to = str(formData.get("to")) as RequestStatus;
  if (!id) return;

  // Throws on an illegal transition (e.g. completed → draft).
  assertTransition(from, to);

  const now = new Date().toISOString();
  const patch: {
    status: RequestStatus;
    sent_at?: string;
    clicked_at?: string;
    completed_at?: string;
  } = { status: to };
  if (to === "sent") patch.sent_at = now;
  if (to === "clicked") patch.clicked_at = now;
  if (to === "completed") patch.completed_at = now;

  const supabase = await createClient();
  await supabase
    .from("review_requests")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", org.id);
  revalidatePath("/app/requests");
}
