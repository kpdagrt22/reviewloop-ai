"use server";

import { redirect } from "next/navigation";
import { verifyOptOutToken } from "@/lib/compliance/optout-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportDbError, logWarn } from "@/lib/observability/log";

/**
 * Public (unauthenticated) opt-out confirmation. The token cryptographically
 * authorizes exactly one customer id, so we use the service-role client to set
 * opt_out = true without a session. Nothing else is mutated.
 */
export async function confirmOptOutAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const customerId = verifyOptOutToken(token);
  if (!customerId) redirect("/optout/invalid");

  const admin = createAdminClient();
  if (!admin) {
    logWarn("opt-out requested but service role is not configured");
    redirect(`/optout/${token}?error=unavailable`);
  }

  const { error } = await admin
    .from("customers")
    .update({ opt_out: true })
    .eq("id", customerId);
  if (reportDbError("customers.update(opt_out:public)", error, { customerId })) {
    redirect(`/optout/${token}?error=failed`);
  }

  redirect(`/optout/${token}?done=1`);
}
