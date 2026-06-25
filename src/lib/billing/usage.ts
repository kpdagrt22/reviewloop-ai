import { createClient } from "@/lib/supabase/server";
import { getPlan, type PlanId } from "@/lib/billing/plans";
import { hasStripe } from "@/lib/env";

/**
 * Lightweight monthly usage. Intentionally simple: counts rows created since the
 * start of the current month. No background metering or rollups.
 */

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export interface MonthlyUsage {
  reviewRequests: number;
  aiReplyDrafts: number;
  customers: number;
}

export async function getMonthlyUsage(orgId: string): Promise<MonthlyUsage> {
  const supabase = await createClient();
  const since = startOfMonthISO();

  const [requests, drafts, customers] = await Promise.all([
    supabase
      .from("review_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", since),
    supabase
      .from("ai_reply_drafts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", since),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  return {
    reviewRequests: requests.count ?? 0,
    aiReplyDrafts: drafts.count ?? 0,
    customers: customers.count ?? 0,
  };
}

/** Resolve the org's plan from its subscription, defaulting to Starter. */
export async function resolvePlanId(orgId: string): Promise<PlanId> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", orgId)
    .maybeSingle();
  const plan = data?.plan as PlanId | undefined;
  if (plan && data?.status === "active" && ["starter", "pro", "business", "agency"].includes(plan)) {
    return plan;
  }
  return "starter";
}

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  quota: number;
  plan: PlanId;
  /** True only when real billing is configured AND the quota is exceeded. */
  enforced: boolean;
  reason?: string;
}

/**
 * Checks whether another review request may be created this month. Enforcement
 * is SOFT: limits are only blocking when Stripe billing is configured. In alpha
 * (no Stripe) the limit is informational so demos are never blocked.
 */
export async function checkReviewRequestQuota(orgId: string): Promise<QuotaCheck> {
  const [{ reviewRequests }, plan] = await Promise.all([
    getMonthlyUsage(orgId),
    resolvePlanId(orgId),
  ]);
  const quota = getPlan(plan).requestQuota;
  const overQuota = reviewRequests >= quota;
  const enforced = hasStripe() && overQuota;
  return {
    allowed: !enforced,
    used: reviewRequests,
    quota,
    plan,
    enforced,
    reason: enforced
      ? `You've reached your ${plan} plan limit of ${quota} review requests this month.`
      : undefined,
  };
}
