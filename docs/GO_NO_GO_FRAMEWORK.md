# Go / No-Go Decision Framework

This framework gives ReviewLoop AI a disciplined, repeatable way to decide whether to
launch, demo, charge, and keep building. Each decision is a **gate**: a short checklist
you evaluate honestly before spending more time or money.

ReviewLoop AI is a review-request + AI-reply + reputation + testimonial + social-proof
workflow for local service businesses. v1 is **manual / link-based** (no Google Business
Profile API), **owner-approved** (nothing auto-posts), and **compliance-aware**.

> **Scope reminder (boundaries, not features):** No fake reviews, no review gating, no
> social auto-posting, no Google Business Profile API, no SMS automation, no inbound-SMS
> STOP automation (STOP is advisory copy; opt-out is set manually), no full CRM, no native
> app, no appointment scheduling, no customer portal. Agency multi-client is a placeholder.
> Never claim "guaranteed 5-star reviews" or "automatic Google review posting."

---

## Gate 1 — Technical Launch

**Question:** Is the product technically ready to be deployed and shown?

**Go if all of these are true:**

- [ ] Unit tests pass (`npm run test` — 85 unit tests verified passing)
- [ ] Build passes (`npm run build` — green, 21 routes)
- [ ] Type + lint clean (`npm run typecheck` clean; `npm run lint` clean)
- [ ] Supabase configured (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` set; migrations `0001_init.sql` → `0002_rls.sql` → `0003_alpha_columns.sql` applied in order; RLS on all 14 tables)
- [ ] Vercel deployment succeeds (note: `npm run seed` is a local/ops script and does **not** run during a Vercel build)
- [ ] Smoke test passes (`npm run test:e2e` — 4 Playwright smoke tests verified passing)
- [ ] Demo seed works (`npm run seed` creates "Sunshine Plumbing (Demo)" with 8 customers, 5 reviews, reply drafts, a negative-review alert, an approved testimonial, and a social post)
- [ ] Env verification passes (`npm run verify:env` — never prints secret values; fails only when a var required for the selected mode is missing)
- [ ] No open release blockers (see PR [#1](https://github.com/kpdagrt22/reviewloop-ai/pull/1), branch `reviewloop-alpha-hardening-validation` → `main`; not merged, not auto-merged)

**Minimum env to launch:** only the two `NEXT_PUBLIC_SUPABASE_*` vars are strictly
required. `AI_PROVIDER` defaults to `mock`. `SUPABASE_SERVICE_ROLE_KEY` + the `STRIPE_*`
vars are required only for billing. All other integrations (Resend, Twilio, OpenAI,
Anthropic) are optional and degrade to mock/disabled.

| Concern | Verified status |
|---|---|
| Unit tests | 85 passing |
| Smoke tests (Playwright) | 4 passing |
| `tsc --noEmit` | clean |
| ESLint | clean |
| `next build` | green, 21 routes |
| `verify:env` | works |

---

## Gate 2 — Beta Demo

**Question:** Can you run a credible live demo without it falling apart or overpromising?

**Go if all of these are true:**

- [ ] The end-to-end demo completes in **under 5 minutes**
- [ ] The positive review example works (rating 5: "Great service. The technician arrived on time, explained the repair clearly, and fixed the issue quickly. Highly recommend.")
- [ ] The negative review example works (rating 2: "The appointment was delayed and I had to call twice for an update. The repair was fine, but communication could have been better.") and triggers the negative-review alert
- [ ] AI fallback works (with no API key, `AI_PROVIDER=mock` produces analysis and a reply draft; `openai` / `anthropic` are optional upgrades)
- [ ] Dashboard (`/app`) and the weekly reputation report (`/app/report`) render real seeded data
- [ ] No misleading compliance copy on screen (no review gating, no "auto-post to Google," no "guaranteed 5 stars")

**Suggested 5-minute demo path (real routes only):**

1. `/app` — Dashboard overview
2. `/app/customers` — show customers (list / add / CSV import)
3. `/app/requests` — compose a review request, copy/send, show 'ready' staging
4. `/app/reviews/new` — capture the positive sample review manually
5. `/app/reviews/[id]` — show AI analysis + reply draft, then promote to testimonial/social
6. `/app/reviews/new` again — capture the negative sample; show the alert behavior
7. `/app/social` — show the copy-only social post (never auto-posted)
8. `/app/report` — close on the weekly reputation report

> Demo login (seeded): `demo@reviewloop.test` / `ReviewLoopDemo123!`

---

## Gate 3 — First Paid User

**Question:** Will a real business pay, and can you onboard them honestly and manually?

**Go if all of these are true:**

- [ ] At least one business has verbally agreed to pay
- [ ] Onboarding can be completed manually (org setup → `/onboarding` → `/app/settings` for review links, tone, escalation email → import customers)
- [ ] No fake review request is involved (only genuine, owner-initiated outreach to real past customers)
- [ ] Customer consent for outreach is understood (STOP is advisory copy; opt-out is recorded manually)
- [ ] A payment method is available (Stripe configured: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, publishable key + price IDs; subscriptions table is member-read-only, written only via the service-role webhook)

**Pricing reference:**

| Plan | Price | Review requests / mo |
|---|---|---|
| Starter | $19/mo | 50 |
| Pro | $49/mo | 250 |
| Business | $99/mo | 1,000 |
| Agency | $199/mo | placeholder (multi-business) |
| One-time setup | $99 | — |

---

## Gate 4 — Continue Building

**Question:** After ~30 days of beta, is there enough signal to keep investing?

**Continue if all of these are true:**

- [ ] 3 paid beta users within 30 days
- [ ] At least 2 users use reply drafts repeatedly
- [ ] At least 1 user uses testimonial or social-proof output (`/app/testimonials` or `/app/social`)
- [ ] No major compliance objections from users or their platforms
- [ ] Demonstrated willingness to pay **≥ $49/month** (Pro tier or above)

### Kill / Pivot signals

Stop or rethink the direction if **any** of these hold:

- [ ] No one is willing to pay $19–$49/month
- [ ] Businesses only want fake reviews (out of scope — do not build this)
- [ ] Review replies are not a painful enough problem to pay for
- [ ] Manual onboarding is too heavy to scale
- [ ] The category is too crowded to differentiate
- [ ] Acquisition response rate is too low to reach paying users affordably

---

## How to Use This

- Evaluate the gates **in order**: Gate 1 → Gate 2 → Gate 3 → Gate 4.
- **Do not advance** to the next gate until every box in the prior gate is checked.
- For each gate, **record the decision (Go / No-Go) and the date**, plus a one-line reason.
- Re-run a gate whenever the underlying facts change (new build, new pricing, new beta cohort).

| Gate | Decision (Go / No-Go) | Date | Notes |
|---|---|---|---|
| 1 — Technical launch | | | |
| 2 — Beta demo | | | |
| 3 — First paid user | | | |
| 4 — Continue building | | | |
