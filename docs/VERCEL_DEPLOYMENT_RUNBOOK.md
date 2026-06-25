# Vercel Deployment Runbook

Practical, checkbox-driven guide for deploying **ReviewLoop AI** (Next.js App
Router + TypeScript + Tailwind + Supabase) to Vercel.

- **Repo:** https://github.com/kpdagrt22/reviewloop-ai.git
- **Hardening PR:** https://github.com/kpdagrt22/reviewloop-ai/pull/1 (branch
  `reviewloop-alpha-hardening-validation` → `main`; **not merged**, **not
  auto-merged** — review and merge manually before promoting to production).

> ReviewLoop AI v1 is **manual / link-based** (no Google Business Profile API),
> **owner-approved** (nothing auto-posts), and **compliance-aware**. The AI
> provider defaults to a deterministic **mock** that needs no API key, so the app
> deploys and runs end-to-end with only the two Supabase keys set.

---

## Verified status (as of this runbook)

| Check | Result |
| --- | --- |
| Unit tests (vitest) | 85 pass |
| Playwright smoke tests | 4 pass |
| `tsc --noEmit` | clean |
| ESLint | clean |
| `next build` | green (21 routes) |
| `verify:env` | works (never prints secret values) |

---

## 1. Import the GitHub repo into Vercel

- [ ] In the Vercel dashboard, click **Add New… → Project**.
- [ ] Connect the GitHub account/org that owns `kpdagrt22/reviewloop-ai`.
- [ ] Select the **reviewloop-ai** repository and click **Import**.
- [ ] Choose the team/scope and confirm the **project name**.

## 2. Build & framework settings (mostly auto-detected)

| Setting | Value |
| --- | --- |
| Framework preset | **Next.js** (auto-detected — leave as-is) |
| Install command | `npm install` (default — no override needed) |
| Build command | `next build` / `npm run build` (default — no override needed) |
| Output directory | `.next` (default — **do not override**) |
| Root directory | repo root (default) |

- [ ] Confirm **Framework Preset = Next.js**.
- [ ] Leave **Install Command** at default (`npm install`).
- [ ] Leave **Build Command** at default (`next build`).
- [ ] Leave **Output Directory** at default (`.next`, no override).

> The app's authenticated routes under `/app/*` are `force-dynamic`; this is
> expected and does not require any Vercel-side configuration.

## 3. Required environment variables

Set these in **Project → Settings → Environment Variables**. These four are the
minimum for a working deploy:

| Variable | Value / notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (**required**) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (**required**) |
| `NEXT_PUBLIC_APP_URL` | The deployed URL (set after first deploy — see §7) |
| `AI_PROVIDER` | `mock` (default mode; deterministic, no API key) |

- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Add `AI_PROVIDER=mock`.
- [ ] Add a placeholder `NEXT_PUBLIC_APP_URL` (update it in §7 once you know the
      real URL).

> Only the two `NEXT_PUBLIC_SUPABASE_*` vars are **strictly required** to build
> and boot. `AI_PROVIDER` defaults to `mock` if unset.

## 4. Optional environment variables

All of these are optional and **degrade gracefully** to mock/disabled when absent.

| Variable | Purpose | If omitted |
| --- | --- | --- |
| `RESEND_API_KEY` | Send escalation email (negative-review alerts) | Email is mocked |
| `FROM_EMAIL` | Sender address for Resend (legacy `RESEND_FROM_EMAIL` also accepted) | Email is mocked |
| `SUPABASE_SERVICE_ROLE_KEY` | Required **only for billing** (service-role webhook writes) | Billing disabled |
| `STRIPE_SECRET_KEY` | Stripe API (billing) | Billing returns 501 |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhooks | Billing disabled |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js publishable key | Billing disabled |
| `NEXT_PUBLIC_STRIPE_PRICE_STARTER` | Price ID — Starter plan | Plan unavailable |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` | Price ID — Pro plan | Plan unavailable |
| `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS` | Price ID — Business plan | Plan unavailable |
| `NEXT_PUBLIC_STRIPE_PRICE_AGENCY` | Price ID — Agency (placeholder) | Plan unavailable |
| `OPENAI_API_KEY` | Real OpenAI provider | Use `mock` |
| `ANTHROPIC_API_KEY` | Real Anthropic provider | Use `mock` |
| `ADMIN_EMAILS` | Comma-separated allowlist for `/app/admin` | Owner fallback only |

> **Twilio is NOT used in v1.** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
> `TWILIO_MESSAGING_SERVICE_SID`, and `TWILIO_PHONE_NUMBER` exist in the env
> schema but are not required and can be left unset. There is no SMS automation
> and no inbound-SMS STOP automation in v1 (STOP is advisory copy; opt-out is
> set manually).

## 5. Preview deployment

- [ ] Push a branch or open a PR — Vercel builds a **Preview** deployment
      automatically.
- [ ] Confirm the Preview build is green (21 routes).
- [ ] Open the Preview URL and run the smoke checklist (§14) against it.
- [ ] Note: the `reviewloop-alpha-hardening-validation` PR is a good first
      Preview target before merging to `main`.

## 6. Production deployment

- [ ] Merge to the production branch (`main`).
- [ ] Vercel builds and deploys **Production** automatically on push to `main`.
- [ ] Confirm the Production build is green.
- [ ] Run the smoke checklist (§14) against the production domain.

## 7. Set `NEXT_PUBLIC_APP_URL`

- [ ] After the first production deploy, copy the assigned Vercel URL (or your
      custom domain).
- [ ] Set `NEXT_PUBLIC_APP_URL` to that exact URL (e.g.
      `https://reviewloop-ai.vercel.app` or your domain).
- [ ] **Redeploy** so the new value is baked into the client bundle
      (`NEXT_PUBLIC_*` vars are inlined at build time).

## 8. Update Supabase callback / redirect URL

Once the deployed URL is known, register it with Supabase Auth:

- [ ] In Supabase → **Authentication → URL Configuration**, set the **Site URL**
      to your deployed URL.
- [ ] Add the deployed URL (and any preview domains you use) to **Redirect
      URLs**.
- [ ] Verify `/login`, `/signup`, and `/onboarding` complete the auth round-trip
      on the live domain.

> Apply migrations in this exact order against your Supabase project **before**
> production traffic:
> `supabase/migrations/0001_init.sql` → `0002_rls.sql` → `0003_alpha_columns.sql`
> → `0004_request_ready_status.sql` → `0005_indexes.sql`.
> `0003`/`0004`/`0005` are additive / non-destructive. RLS is enabled on all 14 tables;
> `subscriptions` is member-**read-only** (writes only via the service-role
> Stripe webhook).

## 9. Stripe (optional, test mode)

The app is **safe without Stripe** — billing endpoints return `501` / "Billing
not configured" until keys are present.

- [ ] (Optional) Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and the four
      `NEXT_PUBLIC_STRIPE_PRICE_*` IDs (test-mode placeholders are fine).
- [ ] (Optional) Add `SUPABASE_SERVICE_ROLE_KEY` (required for billing webhook
      writes).
- [ ] Point the Stripe webhook at `/api/stripe/webhook` and paste the signing
      secret into `STRIPE_WEBHOOK_SECRET`.
- [ ] Confirm `/pricing` and `/app/billing` render plans once keys are set.

**Plans:** Starter $19/mo (50 review requests/mo) · Pro $49/mo (250) · Business
$99/mo (1,000) · Agency $199/mo (placeholder, multi-business) · one-time setup
$99.

## 10. Resend (optional, escalation email)

- [ ] (Optional) Add `RESEND_API_KEY` and `FROM_EMAIL` (legacy
      `RESEND_FROM_EMAIL` is also accepted).
- [ ] With both set, negative-review escalation emails send via Resend.
- [ ] Without them, email is **mocked** (no send, no error) — fine for demos.

## 11. Twilio (not required in v1)

- [ ] Leave all `TWILIO_*` vars unset. v1 has no SMS automation; review request
      delivery is manual/copy-based.

## 12. AI provider

### Mock (default)

- [ ] Set `AI_PROVIDER=mock` (or leave unset). No API key required. Output is
      **deterministic** — ideal for demos and smoke tests.

### Real OpenAI / Anthropic (optional placeholder)

- [ ] Set `AI_PROVIDER=openai` **and** `OPENAI_API_KEY`, **or**
      `AI_PROVIDER=anthropic` **and** `ANTHROPIC_API_KEY`.
- [ ] Redeploy and confirm `/api/ai/analyze` and the reply-draft flow on a
      review detail page return live output.

## 13. Seeding the database (local/ops only — never a build step)

The seed script **does not run during a Vercel build** and must never be wired
into the build command.

- [ ] Run `npm run seed` **from a local/ops machine** that has
      `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set, pointed at
      the target (e.g. production) database.
- [ ] This creates org **"Sunshine Plumbing (Demo)"** with 8 customers, 5
      reviews (ratings 5, 5, 4, 3, 2), a reply draft per review, a
      negative-review alert, an approved testimonial, and a social post.
- [ ] Demo login: `demo@reviewloop.test` / `ReviewLoopDemo123!`

> The service role key is privileged — keep it on trusted machines only and out
> of client/build contexts.

## 14. Smoke test checklist

Run after every production deploy. See **[PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md)**
for the full procedure.

- [ ] Build is green (21 routes).
- [ ] App loads on the deployed domain.
- [ ] Auth round-trip works against the live domain.
- [ ] AI flow returns output (mock = deterministic).
- [ ] Billing renders plans **or** correctly reports "Billing not configured".

### Exact smoke-test URLs

| URL | What to check |
| --- | --- |
| `/` | Marketing landing renders |
| `/login` | Auth screen loads; login works |
| `/app` | Dashboard (the authenticated home) |
| `/app/customers` | Customers list / add / CSV import |
| `/app/requests` | Compose / copy / send review requests |
| `/app/reviews/new` | Manual review capture |
| `/app/report` | Weekly reputation report |
| `/app/social` | Social posts (copy only — never auto-posts) |
| `/pricing` and `/app/billing` | Plans render, or "Billing not configured" |
| `/app/admin` | Loads for an allowlisted owner (gated by `ADMIN_EMAILS`) |

## 15. Rollback to a previous deployment

- [ ] Open **Project → Deployments** in Vercel.
- [ ] Find the last known-good Production deployment.
- [ ] Use the **… menu → Promote to Production** to instantly roll back.
- [ ] Re-run the smoke checklist (§14) against the promoted deployment.

---

## Troubleshooting

### Common build errors

- **Wrong framework preset** — confirm it is **Next.js** (auto-detected). Do not
  override the output directory away from `.next`.
- **Type / lint failures** — reproduce locally with `npm run typecheck` and
  `npm run lint`; both are clean on the verified branch.
- **Build expecting a seed/migration** — neither runs during build. Seeding is a
  local/ops step (§13); migrations are applied directly against Supabase (§8).
- **Missing `NEXT_PUBLIC_*` at build time** — these are inlined at build; add the
  value and **redeploy** (a runtime-only update will not change the bundle).

### Common Supabase env errors

- Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the
  most common failure — these are the only **strictly required** vars.
- Run `npm run verify:env` locally to confirm required vars for the selected
  mode (it exits 1 only when a required var is missing, and never prints secret
  values).
- Auth redirect loops/errors usually mean the Supabase **Site URL / Redirect
  URLs** were not updated to the deployed domain (§8).

### Common Resend errors

- If escalation email silently does nothing, that is the **mocked** path —
  `RESEND_API_KEY` and/or `FROM_EMAIL` are unset (expected; not an error).
- Sends rejected by Resend usually mean an unverified sender domain — verify the
  `FROM_EMAIL` domain in Resend. `RESEND_FROM_EMAIL` is accepted as a legacy
  alias for `FROM_EMAIL`.

### Common Stripe errors

- Billing endpoints returning **`501` / "Billing not configured"** is
  **expected** when Stripe keys are absent — the app is intentionally safe
  without Stripe.
- To enable billing you need the full set: `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, the four
  `NEXT_PUBLIC_STRIPE_PRICE_*` IDs, **and** `SUPABASE_SERVICE_ROLE_KEY` (for
  webhook writes).
- Webhook signature failures → mismatched `STRIPE_WEBHOOK_SECRET` for the
  configured `/api/stripe/webhook` endpoint.

### Common mock-AI confusion

- Mock AI output is **intentional, deterministic, and key-free** — it is the
  default mode, not a bug or a degraded state.
- To use a real model, set `AI_PROVIDER=openai`/`anthropic` plus the matching
  API key, then redeploy (§12).

---

## Scope guardrails (boundaries, not features)

These are **deliberate v1 boundaries** — do not describe them as built or
promise them:

- NO fake reviews · NO review gating · NO social auto-posting
- NO Google Business Profile API · NO SMS automation · NO inbound-SMS STOP
  automation (STOP is advisory copy; opt-out set manually)
- NO full CRM · NO native app · NO appointment scheduling · NO customer portal
- There is **no public customer-facing review redirect route** (`/r/...`) in v1
  — `clicked` is a manual status
- Agency multi-client is a **placeholder**

Never claim "guaranteed 5-star reviews" or "automatic Google review posting".
