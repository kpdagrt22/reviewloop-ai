import { requireOrg } from "@/lib/auth/session";
import { loadDashboard } from "@/lib/data/dashboard";
import { StatCard } from "@/components/ui/card";
import { SummaryGenerator } from "./summary";

export const metadata = { title: "Weekly report — ReviewLoop AI" };

export default async function ReportPage() {
  const org = await requireOrg();
  const { report, testimonialsReady } = await loadDashboard(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reputation report</h1>
        <p className="text-sm text-gray-500">A snapshot of {org.name}&apos;s review activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Requests sent" value={report.requestsSent} />
        <StatCard label="Reviews added" value={report.reviewsAdded} />
        <StatCard
          label="Average rating"
          value={report.averageRating ?? "—"}
          tone={report.averageRating != null && report.averageRating >= 4 ? "good" : "default"}
        />
        <StatCard
          label="Needs attention"
          value={report.negativeNeedingAttention}
          tone={report.negativeNeedingAttention > 0 ? "warn" : "default"}
        />
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-gray-900">Sentiment breakdown</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <Bucket label="Positive" value={report.breakdown.positive} tone="text-green-600" />
            <Bucket label="Neutral" value={report.breakdown.neutral} tone="text-gray-600" />
            <Bucket label="Negative" value={report.breakdown.negative} tone="text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending replies" value={report.pendingReplies} />
        <StatCard label="Testimonial candidates" value={report.testimonialCandidates} />
        <StatCard label="Approved testimonials" value={testimonialsReady} tone={testimonialsReady > 0 ? "good" : "default"} />
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-gray-900">Recommended next actions</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {report.recommendedActions.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-600">→</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <SummaryGenerator />
    </div>
  );
}

function Bucket({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className={`text-3xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}
