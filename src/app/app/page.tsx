import Link from "next/link";
import { requireOrg } from "@/lib/auth/session";
import { loadDashboard } from "@/lib/data/dashboard";
import { StatCard } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Badge, ratingTone, sentimentTone } from "@/components/ui/badge";
import { aiConfigured } from "@/lib/env";

export const metadata = { title: "Dashboard — ReviewLoop AI" };

export default async function DashboardPage() {
  const org = await requireOrg();
  const { report, testimonialsReady, recentReviews } = await loadDashboard(org.id);
  const ai = aiConfigured();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Your reputation at a glance for {org.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/app/customers" variant="outline" size="sm">
            Add customer
          </LinkButton>
          <LinkButton href="/app/requests" variant="outline" size="sm">
            Send review request
          </LinkButton>
          <LinkButton href="/app/reviews/new" size="sm">
            Paste new review
          </LinkButton>
          <LinkButton href="/app/report" variant="outline" size="sm">
            Weekly report
          </LinkButton>
        </div>
      </div>

      {!ai.live ? (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          AI is running in <strong>mock mode</strong> — reply drafts and testimonials work with
          no API key. Set <code>AI_PROVIDER</code> and a key to go live.
        </div>
      ) : null}

      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Requests sent" value={report.requestsSent} />
        <StatCard label="Requests clicked" value={report.requestsClicked} />
        <StatCard label="Reviews collected" value={report.reviewsAdded} />
        <StatCard
          label="Average rating"
          value={report.averageRating ?? "—"}
          tone={report.averageRating != null && report.averageRating >= 4 ? "good" : "default"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Needs attention"
          value={report.negativeNeedingAttention}
          hint="Negative / flagged reviews"
          tone={report.negativeNeedingAttention > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Replies pending"
          value={report.pendingReplies}
          hint="Drafts awaiting approval"
        />
        <StatCard
          label="Testimonials ready"
          value={testimonialsReady}
          hint="Approved testimonials"
          tone={testimonialsReady > 0 ? "good" : "default"}
        />
        <StatCard
          label="Testimonial candidates"
          value={report.testimonialCandidates}
          hint="Positive reviews to reuse"
        />
      </div>

      {/* Negative review alert banner */}
      {report.negativeNeedingAttention > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-medium text-red-800">
            {report.negativeNeedingAttention} review(s) need your attention.
          </p>
          <p className="mt-1 text-sm text-red-700">
            Respond professionally and consider calling the customer to resolve it offline.{" "}
            <Link href="/app/reviews?filter=attention" className="font-medium underline">
              Review now →
            </Link>
          </p>
        </div>
      ) : null}

      {/* Recent activity */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent review activity</h2>
            <Link href="/app/reviews" className="text-sm font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {recentReviews.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-500">No reviews yet.</p>
              <LinkButton href="/app/reviews/new" size="sm" className="mt-3">
                Paste your first review
              </LinkButton>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {recentReviews.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {r.reviewer_name || "Anonymous"}{" "}
                      <span className="text-gray-400">· {r.platform || "review"}</span>
                    </p>
                    <p className="truncate text-sm text-gray-500">{r.review_text}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.rating != null ? (
                      <Badge tone={ratingTone(r.rating)}>{r.rating}★</Badge>
                    ) : null}
                    {r.sentiment ? (
                      <Badge tone={sentimentTone(r.sentiment)}>{r.sentiment}</Badge>
                    ) : null}
                    <Link
                      href={`/app/reviews/${r.id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
