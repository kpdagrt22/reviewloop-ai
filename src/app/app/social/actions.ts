"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";

const str = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());

/** Mark a social post as approved or posted (owner-driven; nothing auto-posts). */
export async function setSocialStatusAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const id = str(formData.get("postId"));
  const status = str(formData.get("status"));
  if (!id || !["draft", "approved", "posted"].includes(status)) return;

  const supabase = await createClient();
  await supabase
    .from("social_posts")
    .update({ status })
    .eq("id", id)
    .eq("organization_id", org.id);
  revalidatePath("/app/social");
}

/** Delete a social post draft. */
export async function deleteSocialPostAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const id = str(formData.get("postId"));
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("social_posts").delete().eq("id", id).eq("organization_id", org.id);
  revalidatePath("/app/social");
}
