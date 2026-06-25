import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";
import { hasSupabase } from "@/lib/env";

/**
 * Server Supabase client bound to the request cookies. Use in Server
 * Components, Route Handlers, and Server Actions. Honours RLS (uses anon key +
 * the user's session), so all queries are organization-scoped by policy.
 */
export async function createClient() {
  if (!hasSupabase()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled by middleware instead.
          }
        },
      },
    },
  );
}
