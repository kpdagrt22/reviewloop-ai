import { SiteNav, SiteFooter } from "@/components/marketing/site-nav";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, SETUP_SERVICE } from "@/lib/billing/plans";

export const metadata = { title: "Pricing — ReviewLoop AI" };

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">
        <div className="container-page py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Pricing that fits a local business</h1>
            <p className="mt-3 text-gray-600">
              Every plan includes manual review capture and AI reply drafts. Cancel anytime.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`card flex flex-col ${p.highlight ? "border-brand-300 ring-1 ring-brand-200" : ""}`}
              >
                <div className="card-body flex flex-1 flex-col">
                  {p.highlight ? <Badge tone="blue" className="mb-2 w-fit">Most popular</Badge> : null}
                  <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    ${p.priceMonthly}
                    <span className="text-base font-normal text-gray-500">/mo</span>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{p.blurb}</p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-700">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-brand-600">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <LinkButton
                    href="/signup"
                    variant={p.highlight ? "primary" : "outline"}
                    className="mt-6 w-full"
                  >
                    Choose {p.name}
                  </LinkButton>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 card mx-auto max-w-2xl">
            <div className="card-body flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="font-semibold text-gray-900">{SETUP_SERVICE.name}</h3>
                <p className="text-sm text-gray-600">{SETUP_SERVICE.blurb}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${SETUP_SERVICE.priceOneTime}
                <span className="text-sm font-normal text-gray-500"> one-time</span>
              </p>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Prices in USD. ReviewLoop never creates fake reviews or hides negative ones.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
