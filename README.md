# ReviewLoop AI

[![CI](https://github.com/kpdagrt22/reviewloop-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/kpdagrt22/reviewloop-ai/actions/workflows/ci.yml)

> Get more 5-star reviews without chasing customers manually.

ReviewLoop AI is a review request, review reply, reputation, and testimonial
automation tool for local service businesses — plumbers, electricians, HVAC,
salons, cleaners, auto shops, dentists, and small agencies.

**The loop:** Job completed → review request → AI reply draft → testimonial / social post.

This is the **MVP / v1**. It does **not** depend on Google API approval. The
workflow is manual/link-based: the business adds a review link, sends/copies
review requests, pastes reviews it receives, and ReviewLoop drafts replies and
turns positive reviews into testimonials and social posts. Nothing is posted
automatically — the owner approves everything.

---

## Tech stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** — Postgres, Auth, Storage, Row Level Security
- **AI provider abstraction** — `mock` (default, no key) / `openai` / `anthropic`
- **Zod** validation, **React Hook Form**–friendly forms
- **Stripe** (optional) subscription abstraction
- **Resend** (optional) email, **Twilio** (optional, mockable) SMS
- **Vitest** unit tests, **Playwright** smoke E2E

Optional integrations degrade gracefully: with no keys, the app still runs
end‑to‑end using the mock AI provider and mock email/SMS senders.

---

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
#   At minimum set the three NEXT_PUBLIC_SUPABASE_* / SUPABASE_SERVICE_ROLE_KEY values.
#   Leave AI_PROVIDER=mock to run with zero AI keys.

# 3. Apply the database schema (see "Supabase migrations" below)

# 4. Run
npm run dev
# open http://localhost:3000
```

The marketing site, pricing, and auth pages render even before Supabase is
configured. The dashboard requires Supabase + a signed‑in user.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (browser + server, RLS‑scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅* | Service role key for the Stripe webhook (bypasses RLS). *Only needed for billing. |
| `AI_PROVIDER` | – | `mock` (default), `openai`, or `anthropic` |
| `OPENAI_API_KEY` | – | Used when `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | – | Used when `AI_PROVIDER=anthropic` |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | – | Email review requests (else mocked) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` | – | SMS review requests (else mocked) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | – | Billing (else "Billing not configured") |
| `STRIPE_PRICE_STARTER/PRO/BUSINESS/AGENCY` | – | Stripe Price IDs per plan |
| `NEXT_PUBLIC_APP_URL` | – | Public base URL (default `http://localhost:3000`) |

See `.env.example` for the full template.

---

## Supabase migrations

Migrations live in [`supabase/migrations`](supabase/migrations):

- `0001_init.sql` — all tables, indexes, `updated_at` triggers, and the
  `auth.users → profiles` / `organization → owner membership` triggers.
- `0002_rls.sql` — enables Row Level Security and the org‑scoping policies.

Apply them with either:

**Supabase CLI (recommended)**

```bash
supabase db reset           # local dev: recreates & applies all migrations
# or, against a linked project:
supabase db push
```

**Manual** — paste the contents of `0001_init.sql` then `0002_rls.sql` into the
Supabase SQL editor and run them in order.

> Auth note: for the smoothest local flow, disable "Confirm email" in
> Supabase Auth settings so sign‑up returns a session immediately. With
> confirmation on, the app asks the user to confirm via email before logging in.

---

## Using the mock AI (default)

With `AI_PROVIDER=mock` (the default), no API key is required. The mock provider
([`src/lib/ai/providers/mock.ts`](src/lib/ai/providers/mock.ts)) returns
deterministic, policy‑compliant analysis and replies, so you can demo the full
loop — paste a review, get sentiment + a reply draft + a testimonial/social
draft for positive reviews, and see negative reviews flagged.

To go live, set `AI_PROVIDER=openai` (and `OPENAI_API_KEY`) or
`AI_PROVIDER=anthropic` (and `ANTHROPIC_API_KEY`). If the chosen provider's key
is missing, the app logs a warning and falls back to mock.

---

## Optional email / SMS setup

- **Email (Resend):** set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Without
  them, "send email" requests are logged to the console (mock) and still recorded.
- **SMS (Twilio):** set the three `TWILIO_*` vars. Without them, SMS is mocked.

Messaging always respects consent and opt‑out (see
[docs/COMPLIANCE.md](docs/COMPLIANCE.md)).

---

## Tests

```bash
npm run test        # Vitest unit tests (schema, rules, status machine, report, CSV, mock AI)
npm run typecheck   # tsc --noEmit
npm run test:e2e    # Playwright smoke tests (boots dev server automatically)
```

Unit tests cover the business‑critical, provider‑independent logic:
sentiment/AI‑output schema validation, the negative‑review escalation rule, the
opt‑out rule, review‑request status transitions, weekly report calculations,
and CSV import.

---

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkpdagrt22%2Freviewloop-ai&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,AI_PROVIDER,NEXT_PUBLIC_APP_URL&envDescription=Supabase%20keys%20%2B%20app%20config%20(AI_PROVIDER%3Dmock%20works%20with%20no%20AI%20key)&envLink=https%3A%2F%2Fgithub.com%2Fkpdagrt22%2Freviewloop-ai%2Fblob%2Fmain%2F.env.example)

The fastest path is the **Vercel ↔ GitHub integration**: import this repo at
[vercel.com/new](https://vercel.com/new) (or use the button above). Vercel
auto‑detects Next.js, and every push to `main` then deploys automatically —
pairing with the CI above (CI must be green for a clean deploy).

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full guide. In short: deploy
to Vercel, set the env vars, apply the Supabase migrations, and point a Stripe
webhook at `/api/stripe/webhook` (only if billing is enabled).

---

## Documentation

- [docs/PRD.md](docs/PRD.md) — product requirements
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design
- [docs/DATABASE.md](docs/DATABASE.md) — schema & RLS
- [docs/AI_REVIEW_WORKFLOW.md](docs/AI_REVIEW_WORKFLOW.md) — AI abstraction & prompts
- [docs/COMPLIANCE.md](docs/COMPLIANCE.md) — review‑policy & messaging guardrails
- [docs/VALIDATION_PLAN.md](docs/VALIDATION_PLAN.md) — how to validate before building more
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — deploy guide

---

## Project structure

```
src/
  app/
    page.tsx                 # landing
    pricing/                 # public pricing
    (auth)/                  # login / signup
    onboarding/              # create organization
    app/                     # authenticated dashboard (force-dynamic)
      page.tsx               #   dashboard
      customers/             #   customers + CSV import
      requests/              #   review request workflow
      reviews/               #   list, /new capture, /[id] detail+reply
      testimonials/          #   testimonial library
      report/                #   weekly reputation report + AI summary
      billing/               #   plans + Stripe checkout
      settings/              #   review links, tone, escalation
      admin/                 #   internal admin/debug diagnostics (org-scoped)
    api/
      ai/analyze/            # stateless AI analysis
      stripe/checkout/       # checkout session
      stripe/webhook/        # subscription sync
  lib/
    ai/                      # provider abstraction + schemas + prompt
    reviews/                 # rules, status machine, analyze orchestration
    reports/weekly.ts        # report calculator
    messaging/               # eligibility, templates, email, sms
    billing/                 # plans + stripe
    customers/csv.ts         # CSV import parser
    supabase/                # client/server/admin + types
    auth/session.ts          # auth & org guards
    validation/schemas.ts    # Zod schemas
supabase/migrations/         # 0001_init.sql, 0002_rls.sql
tests/unit/                  # Vitest
tests/e2e/                   # Playwright
```
