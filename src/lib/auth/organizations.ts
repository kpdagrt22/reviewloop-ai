import { createClient } from "@/lib/supabase/server";
import { getUser, requireUser } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/types";

/**
 * Centralized organization membership + object-ownership assertions.
 *
 * These complement Row Level Security (defense in depth): even though RLS
 * already scopes every query to the caller's organization, server actions/routes
 * should not trust a client-supplied id. Each `assert*BelongsToOrg` re-checks
 * that the object exists AND is owned by `orgId`, returning the row or throwing.
 *
 * Throwing (rather than returning null) keeps call sites terse; callers convert
 * to a user-facing error. Errors never leak which org an id belongs to.
 */

export { getUser, requireUser };

class OwnershipError extends Error {
  constructor(message = "Not found or access denied.") {
    super(message);
    this.name = "OwnershipError";
  }
}

export type Membership = Tables<"organization_members">;

/** Requires the current user to be a member of `orgId`; returns the membership row. */
export async function requireOrganizationMember(orgId: string): Promise<Membership> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new OwnershipError("You are not a member of this organization.");
  return data;
}

/** Requires the current user to be an owner or admin of `orgId`. */
export async function requireOrganizationOwnerOrAdmin(orgId: string): Promise<Membership> {
  const membership = await requireOrganizationMember(orgId);
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new OwnershipError("This action requires owner or admin access.");
  }
  return membership;
}

export { OwnershipError };
