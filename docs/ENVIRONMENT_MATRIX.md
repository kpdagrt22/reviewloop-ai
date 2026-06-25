# Environment Variable Matrix

This document is the single source of truth for configuring **ReviewLoop AI**
(Next.js App Router + TypeScript + Tailwind + Supabase) across local development,
production alpha, and integrated testing.

ReviewLoop AI is built so that **only the two `NEXT_PUBLIC_SUPABASE_*` variables
are strictly required**. Everything else is optional and degrades gracefully:
the AI provider defaults to `mock`, and email / SMS / Stripe integrations stay
disabled until you configure them. Use `npm run verify:env` to confirm your
configuration before building or deploying — it never prints secret values and
fails (exit 1) only when a variable required for the selected mode is missing.

> **Naming note:** `FROM_EMAIL` also accepts the legacy name `RESEND_FROM_EMAIL`.

---

## Variable matrix

| Variable | Required locally? | Required in production? | Public or server-only? | Used by | Placeholder | Failure behavior if missing | Where to set in Vercel | Security notes |
|---|---|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Public (client-exposed) | Supabase client/server auth + data; all `/app/*` routes | `https://YOUR-PROJECT.supabase.co` | App cannot start; `verify:env` exits 1 | Project Settings → Environment Variables | Public by design; not a secret. Safe to expose. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Public (client-exposed) | Supabase browser/server client (RLS-scoped) | `eyJ...anon-key...` | App cannot start; `verify:env` exits 1 | Project Settings → Environment Variables | Public anon key; relies on Row Level Security. Never use the service role key here. |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for seed | Only for billing webhook + seed | Server-only | Stripe webhook subscription writes; `npm run seed` | `eyJ...service-role-key...` | Billing webhook + seed fail; `verify:env` exits 1 in billing mode | Project Settings → Environment Variables | **Bypasses RLS — highest-value secret.** Server-only. Never prefix with `NEXT_PUBLIC_`. |
| `AI_PROVIDER` | No (defaults `mock`) | No (defaults `mock`) | Server-only | AI provider abstraction (`/api/ai/analyze`, reply drafts) | `mock` \| `openai` \| `anthropic` | Defaults to `mock`; no failure | Project Settings → Environment Variables | Not a secret. Selects which provider key is read. |
| `OPENAI_API_KEY` | No | No | Server-only | AI analysis/reply when `AI_PROVIDER=openai` | `sk-...` | Falls back to mock; `verify:env` exits 1 if provider=openai | Project Settings → Environment Variables | Secret. Server-only. Required only when provider is `openai`. |
| `ANTHROPIC_API_KEY` | No | No | Server-only | AI analysis/reply when `AI_PROVIDER=anthropic` | `sk-ant-...` | Falls back to mock; `verify:env` exits 1 if provider=anthropic | Project Settings → Environment Variables | Secret. Server-only. Required only when provider is `anthropic`. |
| `RESEND_API_KEY` | No | No (optional) | Server-only | Outbound email (review request delivery) | `re_...` | Email disabled; copy/link flows still work | Project Settings → Environment Variables | Secret. Server-only. Optional integration. |
| `FROM_EMAIL` | No | No (optional) | Server-only | "From" address for Resend email; legacy `RESEND_FROM_EMAIL` accepted | `hello@yourdomain.com` | Email disabled if unset with Resend | Project Settings → Environment Variables | Not a secret, but must be a verified sender domain in Resend. |
| `TWILIO_ACCOUNT_SID` | No | No (not used in alpha) | Server-only | Twilio SMS (optional, no SMS automation) | `AC...` | SMS disabled; advisory copy only | Project Settings → Environment Variables | Secret. Server-only. Not active in alpha. |
| `TWILIO_AUTH_TOKEN` | No | No (not used in alpha) | Server-only | Twilio SMS auth | `your-twilio-auth-token` | SMS disabled | Project Settings → Environment Variables | Secret. Server-only. Not active in alpha. |
| `TWILIO_MESSAGING_SERVICE_SID` | No | No (not used in alpha) | Server-only | Twilio messaging service | `MG...` | SMS disabled | Project Settings → Environment Variables | Not a secret, but identifies your messaging service. |
| `TWILIO_PHONE_NUMBER` | No | No (not used in alpha) | Server-only | Twilio sender number | `+15555550100` | SMS disabled | Project Settings → Environment Variables | Not a secret. |
| `STRIPE_SECRET_KEY` | No | Only for billing | Server-only | Stripe checkout + webhook (billing) | `sk_test_...` / `sk_live_...` | Billing disabled; `verify:env` exits 1 in billing mode | Project Settings → Environment Variables | **Secret.** Server-only. Use test key in non-prod. |
| `STRIPE_WEBHOOK_SECRET` | No | Only for billing | Server-only | Verifies `/api/stripe/webhook` signatures | `whsec_...` | Webhook signature check fails; subscriptions don't update | Project Settings → Environment Variables | Secret. Server-only. Per-endpoint; differs between test/live. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Only for billing | Public (client-exposed) | Stripe.js on pricing/checkout UI | `pk_test_...` / `pk_live_...` | Checkout UI cannot initialize | Project Settings → Environment Variables | Publishable key; public by design, not a secret. |
| `NEXT_PUBLIC_STRIPE_PRICE_STARTER` | No | Only for billing | Public (client-exposed) | Starter plan price ID on `/pricing`, `/app/billing` | `price_...starter` | Starter plan cannot be purchased | Project Settings → Environment Variables | **Price IDs are not secrets.** Safe to expose. |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` | No | Only for billing | Public (client-exposed) | Pro plan price ID | `price_...pro` | Pro plan cannot be purchased | Project Settings → Environment Variables | Price ID; not a secret. |
| `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS` | No | Only for billing | Public (client-exposed) | Business plan price ID | `price_...business` | Business plan cannot be purchased | Project Settings → Environment Variables | Price ID; not a secret. |
| `NEXT_PUBLIC_STRIPE_PRICE_AGENCY` | No | Only for billing | Public (client-exposed) | Agency plan price ID (placeholder, multi-business) | `price_...agency` | Agency plan cannot be purchased | Project Settings → Environment Variables | Price ID; not a secret. Agency is a placeholder tier. |
| `NEXT_PUBLIC_APP_URL` | No | Recommended | Public (client-exposed) | Absolute URLs (links, email, Stripe redirects) | `https://app.yourdomain.com` | Relative/incorrect links; checkout redirects may break | Project Settings → Environment Variables | Not a secret. Set to your real deployed origin. |
| `ADMIN_EMAILS` | No | Optional | Server-only | Gates `/app/admin` (owner email is fallback) | `you@yourdomain.com,ops@yourdomain.com` | Only the org owner can reach `/app/admin` | Project Settings → Environment Variables | Not a secret, but controls internal admin access. Keep tight. |

### How to read this table

- **Public (client-exposed):** any variable prefixed `NEXT_PUBLIC_` is compiled
  into the browser bundle. Never put a secret behind that prefix. Stripe
  **price IDs** and the **publishable key** are public by design.
- **Server-only:** read only in server code / route handlers and never shipped
  to the client. All API keys, tokens, and the service role key live here.
- **In Vercel:** every variable is set in **Project Settings → Environment
  Variables**, scoped to the appropriate environment (Production / Preview /
  Development). `NEXT_PUBLIC_*` values must be present at **build time**.

---

## Profile A — Local Mock Demo

Goal: run the full app on your machine with zero paid integrations, then load
demo data. Supabase is required for the full app; AI runs in `mock`; no Stripe,
Resend, or Twilio. The seed script is available because you hold the service role
key locally.

Set these in `.env.local`:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` *(needed by `npm run seed` only)*
- [ ] `AI_PROVIDER=mock`

Then:

```bash
npm run verify:env     # confirms mock-mode requirements
npm run seed           # creates "Sunshine Plumbing (Demo)" data
npm run dev
```

Apply migrations in order **before** seeding:
`supabase/migrations/0001_init.sql` → `0002_rls.sql` → `0003_alpha_columns.sql`
→ `0004_request_ready_status.sql` → `0005_indexes.sql`
(0003/0004/0005 are additive / non-destructive).

The seed creates an org with 8 customers, 5 reviews (ratings 5, 5, 4, 3, 2), a
reply draft per review, a negative-review alert, an approved testimonial, and a
social post.

**Demo login:** `demo@reviewloop.test` / `ReviewLoopDemo123!`

> The seed is a **local/ops** script and does **not** run during a Vercel build.
> Run it only from a machine that holds `SUPABASE_SERVICE_ROLE_KEY`.

Notes:

- No `STRIPE_*` → `/app/billing` shows plans but checkout is inactive.
- No `RESEND_API_KEY` → on `/app/requests`, use copy/link flows instead of send.
- Twilio is not used.

---

## Profile B — Production Alpha Minimum

Goal: the smallest viable production deployment. Supabase required; AI stays in
`mock`; Resend optional; Stripe optional; Twilio not used.

Set in Vercel (Project Settings → Environment Variables, **Production** scope):

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `AI_PROVIDER=mock`
- [ ] `NEXT_PUBLIC_APP_URL` *(recommended — your real deployed origin)*

Optional add-ons:

- [ ] `RESEND_API_KEY` + `FROM_EMAIL` *(enable real email send on `/app/requests`)*
- [ ] Stripe set (only if you want live billing — see Profile C for the full set)

Then validate and deploy:

```bash
npm run verify:env
npm run build          # next build is green (21 routes)
```

Notes:

- Without Stripe, `/app/billing` lists plans but cannot take payment.
- `SUPABASE_SERVICE_ROLE_KEY` is **not** required in this profile because the
  billing webhook is off and seeding is a local task.
- Twilio is intentionally omitted — there is no SMS automation in alpha.

---

## Profile C — Production Integrated Test

Goal: exercise real AI, real email, and Stripe **test mode** end to end before
going live. Supabase required; a real AI provider configured; Resend configured;
Stripe configured in test mode; Twilio still optional / not active.

Set in Vercel (Production or a dedicated Preview environment):

Core:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` *(billing webhook writes to `subscriptions`)*
- [ ] `NEXT_PUBLIC_APP_URL`

AI (choose one provider):

- [ ] `AI_PROVIDER=openai` **and** `OPENAI_API_KEY` — *or* —
- [ ] `AI_PROVIDER=anthropic` **and** `ANTHROPIC_API_KEY`

Email (Resend):

- [ ] `RESEND_API_KEY`
- [ ] `FROM_EMAIL` *(verified sender; legacy `RESEND_FROM_EMAIL` accepted)*

Stripe (test mode):

- [ ] `STRIPE_SECRET_KEY` *(`sk_test_...`)*
- [ ] `STRIPE_WEBHOOK_SECRET` *(`whsec_...` for your test endpoint)*
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` *(`pk_test_...`)*
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_STARTER`
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_PRO`
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS`
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_AGENCY` *(placeholder tier)*

Optional (still inactive in alpha):

- [ ] `ADMIN_EMAILS` *(grant `/app/admin` beyond the owner)*
- [ ] `TWILIO_*` *(leave unset — SMS is not active)*

Validate:

```bash
npm run verify:env     # checks AI + billing requirements for this mode
npm run build
```

Smoke test against the running deployment using the sample reviews:

- Positive (rating 5): *"Great service. The technician arrived on time,
  explained the repair clearly, and fixed the issue quickly. Highly recommend."*
- Negative (rating 2): *"The appointment was delayed and I had to call twice for
  an update. The repair was fine, but communication could have been better."*

Capture each via `/app/reviews/new`, open `/app/reviews/[id]` for AI analysis and
a reply draft, confirm the negative review raises an escalation per `/app/settings`,
then check the weekly rollup at `/app/report`.

---

## Pricing reference (Stripe price IDs map to these plans)

| Plan | Price | Monthly review requests | Notes |
|---|---|---|---|
| Starter | $19/mo | 50 | |
| Pro | $49/mo | 250 | |
| Business | $99/mo | 1,000 | |
| Agency | $199/mo | — | Placeholder, multi-business |
| Setup | $99 one-time | — | One-time onboarding fee |

---

## Verified status

- 85 unit tests pass (vitest).
- 4 Playwright smoke tests pass.
- `tsc --noEmit` clean; eslint clean.
- `next build` green (21 routes).
- `npm run verify:env` works and never prints secret values.

---

## Scope guardrails (boundaries, not features)

These are intentional limits of v1. Do not configure environment variables
expecting any of the following — none of it is built:

- No fake reviews and no review gating.
- No social auto-posting (`/app/social` is **copy only**).
- No Google Business Profile API.
- No SMS automation and no inbound-SMS STOP automation (STOP is advisory copy;
  opt-out is set manually). Twilio variables exist but are not active in alpha.
- No full CRM, no native app, no appointment scheduling, no customer portal.
- Agency multi-client is a placeholder.

Never claim "guaranteed 5-star reviews" or "automatic Google review posting."
Nothing auto-posts: the workflow is owner-approved and compliance-aware. There is
no public customer-facing review redirect route in v1 — the `clicked` status is
set manually.

---

## Reference

- **Repo:** https://github.com/kpdagrt22/reviewloop-ai.git
- **PR:** https://github.com/kpdagrt22/reviewloop-ai/pull/1
  (branch `reviewloop-alpha-hardening-validation` → `main`; not merged; not auto-merged).
