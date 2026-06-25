import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PLANS, SETUP_SERVICE, getPlan } from "@/lib/billing/plans";
import { billingConfigured } from "@/lib/billing/stripe";
import { getMonthlyUsage, resolvePlanId } from "@/lib/billing/usage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfigNotice } from "@/components/app/config-notice";
import { startCheckoutAction } from "./actions";

export const metadata = { title: "Billing — ReviewLoop AI" };

export default async function BillingPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", org.id)
    .maybeSingle();

  const [usage, planId] = await Promise.all([
    getMonthlyUsage(org.id),
    resolvePlanId(org.id),
  ]);
  const quota = getPlan(planId).requestQuota;
  const usagePct = quota > 0 ? Math.min(100, Math.round((usage.reviewRequests / quota) * 100)) : 0;

  const configured = billingConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500">Manage your ReviewLoop subscription.</p>
      </div>

      {!configured ? (
        <ConfigNotice
          title="Billing not configured"
          body="Stripe keys are not set. Add STRIPE_SECRET_KEY and the NEXT_PUBLIC_STRIPE_PRICE_* env vars to enable checkout. You can still use the full app without billing."
        />
      ) : null}

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current plan</p>
              <p className="text-lg font-semibold capitalize text-gray-900">
                {sub?.plan ?? "Free / trial"}
              </p>
            </div>
            <Badge tone={sub?.status === "active" ? "green" : "gray"}>
              {sub?.status ?? "no subscription"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Usage this month */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Usage this month</h2>
            <span className="text-sm text-gray-500">
              Plan limit: {quota.toLocaleString()} review requests
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full ${usagePct >= 100 ? "bg-red-500" : "bg-brand-500"}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-sm text-gray-700">
              {usage.reviewRequests.toLocaleString()} / {quota.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-600 sm:grid-cols-3">
            <span>{usage.reviewRequests} review requests</span>
            <span>{usage.aiReplyDrafts} AI reply drafts</span>
            <span>{usage.customers} customers</span>
          </div>
          {!configured ? (
            <p className="mt-3 text-xs text-gray-400">
              Limits are shown for reference only and are not enforced until billing is configured.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`card flex flex-col ${p.highlight ? "border-brand-300 ring-1 ring-brand-200" : ""}`}
          >
            <div className="card-body flex flex-1 flex-col">
              <h3 className="font-semibold text-gray-900">{p.name}</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                ${p.priceMonthly}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <ul className="mt-3 flex-1 space-y-1 text-sm text-gray-600">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <form action={startCheckoutAction} className="mt-4">
                <input type="hidden" name="plan" value={p.id} />
                <Button
                  type="submit"
                  variant={p.highlight ? "primary" : "outline"}
                  className="w-full"
                  disabled={!configured}
                >
                  {sub?.plan === p.id ? "Current plan" : `Choose ${p.name}`}
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-semibold text-gray-900">{SETUP_SERVICE.name}</h3>
            <p className="text-sm text-gray-600">{SETUP_SERVICE.blurb}</p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ${SETUP_SERVICE.priceOneTime} one-time
          </p>
        </div>
      </div>
    </div>
  );
}
