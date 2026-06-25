import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type Organization = Tables<"organizations">;

/** Returns the signed-in user or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Requires a signed-in user; redirects to /login otherwise. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Returns the active organization for the current user (MVP: the first org they
 * belong to). Returns null if the user has not completed onboarding.
 */
export async function getActiveOrg(): Promise<Organization | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.organization_id)
    .maybeSingle();

  return org ?? null;
}

/**
 * Guards an app route: requires a user AND a completed organization. Redirects
 * to onboarding if the user hasn't created an org yet.
 */
export async function requireOrg(): Promise<Organization> {
  await requireUser();
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");
  return org;
}
