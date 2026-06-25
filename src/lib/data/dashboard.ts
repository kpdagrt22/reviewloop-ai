import { createClient } from "@/lib/supabase/server";
import {
  computeWeeklyReport,
  type ReportReview,
  type WeeklyReport,
} from "@/lib/reports/weekly";
import type { Tables } from "@/lib/supabase/types";

const SENTIMENTS = ["positive", "neutral", "negative"] as const;
function asSentiment(s: string | null): ReportReview["sentiment"] {
  return SENTIMENTS.includes(s as never) ? (s as ReportReview["sentiment"]) : null;
}

export interface DashboardData {
  report: WeeklyReport;
  testimonialsReady: number;
  recentReviews: Tables<"reviews">[];
}

/**
 * Loads the metrics shown on the dashboard for an organization. Relies on RLS
 * plus an explicit organization_id filter (defense in depth).
 */
export async function loadDashboard(orgId: string): Promise<DashboardData> {
  const supabase = await createClient();

  const [requestsRes, reviewsRes, draftsRes, testimonialsRes, recentRes] =
    await Promise.all([
      supabase.from("review_requests").select("status").eq("organization_id", orgId),
      supabase
        .from("reviews")
        .select("rating, sentiment")
        .eq("organization_id", orgId),
      supabase.from("ai_reply_drafts").select("status").eq("organization_id", orgId),
      supabase
        .from("testimonials")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("approved", true),
      supabase
        .from("reviews")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const report = computeWeeklyReport({
    requests: requestsRes.data ?? [],
    reviews: (reviewsRes.data ?? []).map((r) => ({
      rating: r.rating,
      sentiment: asSentiment(r.sentiment),
    })),
    drafts: draftsRes.data ?? [],
  });

  return {
    report,
    testimonialsReady: testimonialsRes.count ?? 0,
    recentReviews: recentRes.data ?? [],
  };
}
