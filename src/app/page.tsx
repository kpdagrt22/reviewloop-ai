import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/marketing/site-nav";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, SETUP_SERVICE } from "@/lib/billing/plans";

const USE_CASES = [
  { icon: "🔧", title: "Home services", desc: "Plumbers, electricians, HVAC, handymen." },
  { icon: "💇", title: "Salons & spas", desc: "Stylists, barbers, nail & beauty studios." },
  { icon: "🧹", title: "Cleaning", desc: "Residential & commercial cleaning crews." },
  { icon: "🚗", title: "Auto repair", desc: "Mechanics, detailers, body shops." },
  { icon: "🛠️", title: "Repair shops", desc: "Local repair & maintenance businesses." },
  { icon: "📈", title: "Local agencies", desc: "Agencies managing reviews for clients." },
];

const STEPS = [
  { n: 1, title: "Add customer", desc: "Log the customer you just served — name, contact, service." },
  { n: 2, title: "Send review request", desc: "Email, SMS, or copy a ready-to-send message with your review link." },
  { n: 3, title: "Paste or track review", desc: "Paste the review you received, or mark the request as completed." },
  { n: 4, title: "AI drafts response", desc: "Get a professional reply draft you review and approve." },
  { n: 5, title: "Reuse as proof", desc: "Turn 5-star reviews into testimonials and social posts." },
];

const FAQ = [
  { q: "Does this create fake reviews?", a: "No. ReviewLoop never writes or posts fake reviews. It only helps you request real reviews and draft replies you approve." },
  { q: "Does this auto-post replies?", a: "No. Every reply, testimonial, and social post is a draft. You review and post it yourself — nothing goes live without your approval." },
  { q: "Does this require Google integration?", a: "No, not in v1. You add your Google review link and paste reviews manually. Google Business Profile API is a later add-on." },
  { q: "Can customers opt out?", a: "Yes. We only message customers who consented, every customer can opt out, and opted-out customers are never contacted." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-gray-50">
        <div className="container-page py-20 text-center">
          <Badge tone="blue" className="mb-4">No Google API required to start</Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Get more genuine reviews — without chasing customers manually.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
            Send review requests, draft professional replies, catch unhappy customers early,
            and turn great reviews into social proof.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <LinkButton href="/signup" size="lg">
              Start Review Loop
            </LinkButton>
            <LinkButton href="/pricing" variant="outline" size="lg">
              See pricing
            </LinkButton>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Works with mock AI out of the box — no API keys needed to try it.
          </p>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="container-page grid gap-6 py-16 md:grid-cols-2">
        <div className="card">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-gray-900">The problem</h2>
            <ul className="mt-4 space-y-3 text-gray-600">
              <li>• Happy customers forget to leave reviews.</li>
              <li>• Bad reviews get ignored — or replied to badly.</li>
              <li>• Great feedback never gets reused as proof.</li>
            </ul>
          </div>
        </div>
        <div className="card border-brand-200">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-gray-900">The ReviewLoop</h2>
            <p className="mt-4 text-gray-600">
              Job completed → review request → AI reply draft → testimonial / social post.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              A simple loop that keeps reviews coming and turns them into marketing.
            </p>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="usecases" className="bg-white py-16">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold text-gray-900">Built for local service businesses</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((u) => (
              <div key={u.title} className="card">
                <div className="card-body">
                  <div className="text-2xl">{u.icon}</div>
                  <h3 className="mt-3 font-semibold text-gray-900">{u.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold text-gray-900">How it works</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {STEPS.map((s) => (
              <div key={s.n} className="card">
                <div className="card-body">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-semibold text-white">
                    {s.n}
                  </div>
                  <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="bg-white py-16">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold text-gray-900">Simple, honest pricing</h2>
          <p className="mt-2 text-center text-gray-600">
            Start small. Upgrade when reviews start rolling in.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`card ${p.highlight ? "border-brand-300 ring-1 ring-brand-200" : ""}`}
              >
                <div className="card-body">
                  {p.highlight ? <Badge tone="blue">Most popular</Badge> : null}
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{p.name}</h3>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    ${p.priceMonthly}
                    <span className="text-base font-normal text-gray-500">/mo</span>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{p.blurb}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            Plus optional {SETUP_SERVICE.name.toLowerCase()} for ${SETUP_SERVICE.priceOneTime} one-time.{" "}
            <Link href="/pricing" className="font-medium text-brand-600 hover:underline">
              Full pricing →
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16">
        <div className="container-page max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="card">
                <div className="card-body">
                  <h3 className="font-semibold text-gray-900">{f.q}</h3>
                  <p className="mt-2 text-sm text-gray-600">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600">
        <div className="container-page py-14 text-center">
          <h2 className="text-2xl font-bold text-white">Ready to close the loop on reviews?</h2>
          <p className="mt-2 text-brand-100">Set up in minutes. No Google approval needed.</p>
          <div className="mt-6">
            <LinkButton href="/signup" variant="secondary" size="lg">
              Start Review Loop
            </LinkButton>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
