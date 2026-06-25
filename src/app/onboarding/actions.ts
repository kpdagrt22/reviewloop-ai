"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { onboardingSchema } from "@/lib/validation/schemas";
import { DEFAULT_REQUEST_BODY, DEFAULT_REQUEST_SUBJECT } from "@/lib/messaging/templates";

export interface OnboardingState {
  error?: string;
}

const asBool = (v: FormDataEntryValue | null) => v === "on" || v === "true";
const asStr = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());

export async function createOrganizationAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    businessName: asStr(formData.get("businessName")),
    ownerName: asStr(formData.get("ownerName")),
    email: asStr(formData.get("email")),
    phone: asStr(formData.get("phone")),
    website: asStr(formData.get("website")),
    businessType: asStr(formData.get("businessType")),
    country: asStr(formData.get("country")),
    state: asStr(formData.get("state")),
    city: asStr(formData.get("city")),
    timezone: asStr(formData.get("timezone")),
    googleReviewLink: asStr(formData.get("googleReviewLink")),
    facebookReviewLink: asStr(formData.get("facebookReviewLink")),
    otherReviewLink: asStr(formData.get("otherReviewLink")),
    brandTone: asStr(formData.get("brandTone")) || "professional",
    escalationEmail: asStr(formData.get("escalationEmail")),
    messagingConsent: asBool(formData.get("messagingConsent")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;
  const supabase = await createClient();

  // Keep the profile's display name in sync with the owner name.
  await supabase
    .from("profiles")
    .update({ full_name: d.ownerName, email: d.email })
    .eq("id", user.id);

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      owner_id: user.id,
      name: d.businessName,
      business_type: d.businessType,
      country: d.country,
      state: d.state || null,
      city: d.city || null,
      timezone: d.timezone,
      website: d.website || null,
      phone: d.phone || null,
      google_review_link: d.googleReviewLink || null,
      facebook_review_link: d.facebookReviewLink || null,
      other_review_link: d.otherReviewLink || null,
      brand_tone: d.brandTone,
      escalation_email: d.escalationEmail || null,
    })
    .select("id")
    .single();

  if (error || !org) {
    return { error: error?.message ?? "Could not create your business. Try again." };
  }

  // Seed a default manual campaign + request template so the user can act
  // immediately. Best-effort: failures here don't block onboarding.
  const { data: campaign } = await supabase
    .from("review_campaigns")
    .insert({
      organization_id: org.id,
      name: "Default review request",
      channel: "manual",
      timing_days_after_service: 1,
      active: true,
    })
    .select("id")
    .single();

  await supabase.from("message_templates").insert({
    organization_id: org.id,
    campaign_id: campaign?.id ?? null,
    channel: "email",
    subject: DEFAULT_REQUEST_SUBJECT,
    body: DEFAULT_REQUEST_BODY,
    active: true,
  });

  redirect("/app");
}
