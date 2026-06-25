import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { hasSupabaseServiceRole } from "@/lib/env";

/**
 * Service-role client. BYPASSES RLS — use only in trusted server contexts
 * (e.g. Stripe webhooks writing subscription state) and never expose to the
 * browser. Returns null if the service role key is not configured.
 */
export function createAdminClient() {
  if (!hasSupabaseServiceRole() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
