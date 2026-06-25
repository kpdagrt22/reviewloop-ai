"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { BRAND_TONES } from "@/lib/validation/schemas";

export interface SettingsState {
  ok?: boolean;
  error?: string;
}

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Business name is required"),
  phone: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  googleReviewLink: z.string().trim().url().optional().or(z.literal("")),
  facebookReviewLink: z.string().trim().url().optional().or(z.literal("")),
  otherReviewLink: z.string().trim().url().optional().or(z.literal("")),
  brandTone: z.enum(BRAND_TONES),
  escalationEmail: z.string().trim().email().optional().or(z.literal("")),
});

const str = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const org = await requireOrg();
  const parsed = settingsSchema.safeParse({
    name: str(formData.get("name")),
    phone: str(formData.get("phone")),
    website: str(formData.get("website")),
    googleReviewLink: str(formData.get("googleReviewLink")),
    facebookReviewLink: str(formData.get("facebookReviewLink")),
    otherReviewLink: str(formData.get("otherReviewLink")),
    brandTone: str(formData.get("brandTone")) || "professional",
    escalationEmail: str(formData.get("escalationEmail")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: d.name,
      phone: d.phone || null,
      website: d.website || null,
      google_review_link: d.googleReviewLink || null,
      facebook_review_link: d.facebookReviewLink || null,
      other_review_link: d.otherReviewLink || null,
      brand_tone: d.brandTone,
      escalation_email: d.escalationEmail || null,
    })
    .eq("id", org.id);

  if (error) return { error: error.message };
  revalidatePath("/app/settings");
  return { ok: true };
}
