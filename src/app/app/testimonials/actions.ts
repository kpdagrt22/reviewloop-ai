"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";

const str = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());

/** Approve or un-approve a testimonial for use. */
export async function setTestimonialApprovedAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const id = str(formData.get("testimonialId"));
  const approved = str(formData.get("approved")) === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("testimonials")
    .update({ approved })
    .eq("id", id)
    .eq("organization_id", org.id);
  revalidatePath("/app/testimonials");
}

/** Delete a testimonial. */
export async function deleteTestimonialAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const id = str(formData.get("testimonialId"));
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("testimonials").delete().eq("id", id).eq("organization_id", org.id);
  revalidatePath("/app/testimonials");
}
