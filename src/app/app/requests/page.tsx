import Link from "next/link";
import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ComposeRequest } from "./compose";
import { updateRequestStatusAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfigNotice } from "@/components/app/config-notice";
import {
  getReviewRequestStatusBadgeVariant,
  getReviewRequestStatusLabel,
  type RequestStatus,
} from "@/lib/reviews/request-status";

export const metadata = { title: "Review requests — ReviewLoop AI" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const org = await requireOrg();
  const { customer } = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, { data: requests }] = await Promise.all([
    supabase
      .from("customers")
      .select("id,name,email,phone,consent_email,consent_sms,opt_out")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("review_requests")
      .select("id,channel,status,sent_at,customer_id,created_at")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const reviewLink =
    org.google_review_link ||
    org.facebook_review_link ||
    org.yelp_review_link ||
    org.trustpilot_review_link ||
    org.other_review_link ||
    "";

  const customerName = new Map((customers ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review requests</h1>
        <p className="text-sm text-gray-500">
          Send or copy a review request, then track its status.
        </p>
      </div>

      {!reviewLink ? (
        <ConfigNotice
          title="No review link yet"
          body="Add a Google (or Facebook/Yelp) review link in Settings so requests have somewhere to point."
        />
      ) : null}

      {reviewLink ? (
        <ComposeRequest
          customers={customers ?? []}
          businessName={org.name}
          reviewLink={reviewLink}
          preselectedId={customer}
        />
      ) : null}

      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-gray-900">Recent requests</h2>
          {!requests || requests.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-500">
              No requests sent yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Channel</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {r.customer_id ? customerName.get(r.customer_id) ?? "—" : "—"}
                      </td>
                      <td className="py-3 pr-4 capitalize text-gray-600">{r.channel}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={getReviewRequestStatusBadgeVariant(r.status)}>
                          {getReviewRequestStatusLabel(r.status)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusActions id={r.id} status={r.status as RequestStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Got a review back?{" "}
        <Link href="/app/reviews/new" className="font-medium text-brand-600 hover:underline">
          Paste it here →
        </Link>
      </p>
    </div>
  );
}

function StatusActions({ id, status }: { id: string; status: RequestStatus }) {
  const next: { to: RequestStatus; label: string }[] = [];
  if (status === "draft") {
    next.push({ to: "sent", label: "Mark sent" });
  } else if (status === "ready") {
    next.push({ to: "sent", label: "Mark sent" });
    next.push({ to: "cancelled", label: "Cancel" });
  } else if (status === "sent") {
    next.push({ to: "clicked", label: "Mark clicked" });
    next.push({ to: "completed", label: "Mark completed" });
  } else if (status === "clicked") {
    next.push({ to: "completed", label: "Mark completed" });
  }

  if (next.length === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  return (
    <div className="flex gap-2">
      {next.map((n) => (
        <form key={n.to} action={updateRequestStatusAction}>
          <input type="hidden" name="requestId" value={id} />
          <input type="hidden" name="from" value={status} />
          <input type="hidden" name="to" value={n.to} />
          <Button type="submit" size="sm" variant="ghost">
            {n.label}
          </Button>
        </form>
      ))}
    </div>
  );
}
