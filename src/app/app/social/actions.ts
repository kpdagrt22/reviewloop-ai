"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { requireOrganizationOwnerOrAdmin } from "@/lib/auth/organizations";
import { SOCIAL_POST_STATUSES, isOneOf } from "@/lib/db/enums";
import { reportDbError } from "@/lib/observability/log";

const str = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());

/** Mark a social post as approved or posted (owner-driven; nothing auto-posts). */
export async function setSocialStatusAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const id = str(formData.get("postId"));
  const status = str(formData.get("status"));
  if (!id || !isOneOf(SOCIAL_POST_STATUSES, status)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("social_posts")
    .update({ status })
    .eq("id", id)
    .eq("organization_id", org.id);
  reportDbError("social_posts.update(status)", error, { id, status });
  revalidatePath("/app/social");
}

/** Delete a social post draft. Destructive — restricted to owner/admin. */
export async function deleteSocialPostAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  await requireOrganizationOwnerOrAdmin(org.id);
  const id = str(formData.get("postId"));
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("social_posts")
    .delete()
    .eq("id", id)
    .eq("organization_id", org.id);
  reportDbError("social_posts.delete", error, { id });
  revalidatePath("/app/social");
}
