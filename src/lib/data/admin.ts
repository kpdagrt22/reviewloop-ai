import { createClient } from "@/lib/supabase/server";
import {
  aiConfigured,
  hasResend,
  hasStripe,
  hasSupabaseServiceRole,
  hasTwilio,
} from "@/lib/env";
import { getAIProvider } from "@/lib/ai/service";
import type { Tables } from "@/lib/supabase/types";

export interface FeatureFlag {
  key: string;
  label: string;
  enabled: boolean;
  detail: string;
}

export interface AdminDiagnostics {
  provider: { name: string; model: string; live: boolean };
  flags: FeatureFlag[];
  counts: Record<string, number>;
  recentAiLogs: Pick<
    Tables<"ai_review_logs">,
    "id" | "provider" | "model" | "status" | "error_message" | "created_at"
  >[];
  recentEvents: Pick<
    Tables<"notification_events">,
    "id" | "event_type" | "created_at"
  >[];
  subscription: Pick<Tables<"subscriptions">, "plan" | "status"> | null;
}

const COUNT_TABLES = [
  "customers",
  "review_campaigns",
  "message_templates",
  "review_requests",
  "reviews",
  "ai_reply_drafts",
  "testimonials",
  "social_posts",
  "notification_events",
  "ai_review_logs",
] as const;

/**
 * Loads org-scoped diagnostics for the internal admin/debug page. Reports only
 * BOOLEAN config flags (never secret values) plus row counts and recent
 * org-scoped log/event metadata. All queries are RLS-scoped and additionally
 * filtered by organization_id (defense in depth).
 */
export async function loadAdminDiagnostics(orgId: string): Promise<AdminDiagnostics> {
  const supabase = await createClient();
  const ai = aiConfigured();
  const provider = getAIProvider();

  const flags: FeatureFlag[] = [
    {
      key: "ai",
      label: "AI provider",
      enabled: ai.live,
      detail: ai.live ? `${ai.provider} (live)` : `${ai.provider} (mock fallback)`,
    },
    {
      key: "service_role",
      label: "Supabase service role",
      enabled: hasSupabaseServiceRole(),
      detail: hasSupabaseServiceRole() ? "configured" : "not set (needed for billing webhook)",
    },
    {
      key: "resend",
      label: "Email (Resend)",
      enabled: hasResend(),
      detail: hasResend() ? "configured" : "mock — emails logged only",
    },
    {
      key: "twilio",
      label: "SMS (Twilio)",
      enabled: hasTwilio(),
      detail: hasTwilio() ? "configured" : "mock — SMS logged only",
    },
    {
      key: "stripe",
      label: "Billing (Stripe)",
      enabled: hasStripe(),
      detail: hasStripe() ? "configured" : "not configured",
    },
  ];

  // Row counts per table (head + exact count = no row data transferred).
  const countResults = await Promise.all(
    COUNT_TABLES.map((t) =>
      supabase
        .from(t)
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
    ),
  );
  const counts: Record<string, number> = {};
  COUNT_TABLES.forEach((t, i) => {
    counts[t] = countResults[i].count ?? 0;
  });

  const [aiLogsRes, eventsRes, subRes] = await Promise.all([
    supabase
      .from("ai_review_logs")
      .select("id, provider, model, status, error_message, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notification_events")
      .select("id, event_type, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", orgId)
      .maybeSingle(),
  ]);

  return {
    provider: { name: provider.name, model: provider.model, live: ai.live },
    flags,
    counts,
    recentAiLogs: aiLogsRes.data ?? [],
    recentEvents: eventsRes.data ?? [],
    subscription: subRes.data ?? null,
  };
}
