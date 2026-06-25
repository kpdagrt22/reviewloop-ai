# Post-Launch Monitoring & Incident Plan

ReviewLoop AI — operational runbook for the beta period. This doc is written for a
solo founder / small ops team running the alpha. It assumes the standard stack:
Next.js App Router + TypeScript + Tailwind, Supabase (Postgres + Auth + RLS), and
the AI provider abstraction (`mock` default, `openai`, or `anthropic`).

> **Scope reminder.** v1 is manual/link-based and owner-approved. Nothing
> auto-posts. There is **no Google Business Profile API**, **no review gating**,
> **no fake reviews**, **no social auto-posting**, **no SMS automation**, and
> **no inbound-SMS STOP automation** (STOP is advisory copy; opt-out is set
> manually). Never claim "guaranteed 5-star reviews" or "automatic Google review
> posting." Monitoring exists to confirm those boundaries hold, not to relax them.

---

## 1. Daily Checks During Beta

Run this pass once per day while the beta is live. Most signals are visible from
the **`/app/admin`** internal debug page, which is gated by `ADMIN_EMAILS` (with
an owner fallback). That page shows **org-scoped config flags**, recent
**`ai_review_logs`** (including `scrubbed` and `error` status), and recent
**`notification_events`** — making it the fastest single place to spot AI and
email failures.

| # | Check | Where to look | What "good" looks like |
|---|-------|---------------|------------------------|
| 1 | Vercel deployment status | Vercel dashboard → Deployments | Latest production deploy is **Ready** (green), no failed builds |
| 2 | Supabase errors | Supabase dashboard → Logs / Postgres logs | No spikes in 4xx/5xx, no RLS-denied floods, no connection errors |
| 3 | Auth signups | `/signup` flow + Supabase Auth users | New beta signups land; no stuck/unconfirmed pileups |
| 4 | Customer creation | `/app/customers` + `customers` table | New rows appear; CSV import succeeds without partial failures |
| 5 | Review requests | `/app/requests` + `review_requests` table | Compose/copy/send works; `ready` staging items progress |
| 6 | Reviews captured | `/app/reviews`, `/app/reviews/new` + `reviews` table | Manual capture saves; ratings persist correctly |
| 7 | AI failures | `/app/admin` → recent `ai_review_logs` | Mostly `ok`/`scrubbed`; investigate any `error` rows |
| 8 | Negative alerts | `/app/admin` → `notification_events` | Low-rating reviews generate an alert event as expected |
| 9 | Email failures | `/app/admin` → `notification_events` | Sends succeed; failures are rare and explained (e.g. bad address) |
| 10 | Billing errors *(if configured)* | `/app/billing` + Stripe dashboard | Checkout completes; webhook events succeed; `subscriptions` updates |

Notes:

- **AI provider.** If `AI_PROVIDER=mock` (the default, no key), AI calls are
  deterministic and should never error externally. `error` rows on `mock` point
  at a code/data problem, not a vendor outage. On `openai`/`anthropic`, `error`
  rows may indicate quota, key, or upstream issues.
- **`scrubbed` status** is expected behavior, not a fault — it means content was
  sanitized. Watch the **ratio**; a sudden jump warrants a look at inputs.
- **Billing checks only apply** when `SUPABASE_SERVICE_ROLE_KEY` and the
  `STRIPE_*` vars are set. Without them, billing is intentionally inactive.

Daily checklist (copy per day):

- [ ] Vercel latest deploy is Ready
- [ ] Supabase logs clean (no error spike)
- [ ] New signups working
- [ ] Customer create / CSV import working
- [ ] Review requests compose/copy/send working
- [ ] Reviews captured correctly
- [ ] `ai_review_logs` reviewed — no unexplained `error`
- [ ] Negative-review alerts firing
- [ ] Email `notification_events` succeeding
- [ ] Billing OK (only if configured)

---

## 2. Manual Database Checks

Spot-check these tables directly in Supabase (SQL editor or table view) a few
times a week, or whenever a daily check looks off. All tables have **RLS**;
`subscriptions` is **member-read-only** (writes happen only via the service-role
Stripe webhook).

| Table | Spot-check for |
|-------|----------------|
| `organizations` | One row per real beta business; no orphaned/dupe orgs |
| `customers` | Rows tied to the correct org; opt-out flags reflect manual choices |
| `review_requests` | Status transitions sane (`ready` → sent → `clicked` is **manual**) |
| `reviews` | Ratings and text match what was captured; correct org/customer |
| `ai_reply_drafts` | A draft per review where expected; no leaked cross-org text |
| `testimonials` | Only approved items surface; approval state is correct |
| `social_posts` | Copy-only records; **nothing marked auto-posted** |
| `notification_events` | Alerts and email events logged; failures explained |
| `subscriptions` | Matches Stripe; only changed by the webhook, never by members |

> Reminder: `clicked` on a review request is a **manual status** — there is no
> public customer-facing redirect route (`/r/...`) in v1. If `clicked` is set,
> a human set it.

---

## 3. Error Severity Scale

Use this to triage fast and decide who to wake up.

| Severity | Definition | Examples |
|----------|------------|----------|
| **LOW** | Cosmetic; no workflow blocked | UI misalignment, typo, wrong label, minor copy issue |
| **MED** | One workflow degraded but usable | AI drafts failing back to manual, email send flaky, slow page |
| **HIGH** | Review capture broken | `/app/reviews/new` won't save, requests can't be created/sent, data not persisting |
| **CRITICAL** | Data/security failure | **Customer data leakage, wrong-org access, auth bypass, secrets leak, or fake-review risk** |

Rule of thumb:

- LOW → log it, batch the fix.
- MED → fix this week; communicate if a customer is affected.
- HIGH → fix now; pause the affected workflow.
- CRITICAL → stop, contain, and treat as a privacy/compliance incident
  (see §5) **before** doing anything else.

---

## 4. Incident Response

When something crosses MED or above, follow these steps in order:

1. **Stop the affected workflow.** Disable or pause the broken path so it can't
   make things worse (e.g. stop sending requests, fall an integration back to
   `mock`, see §6).
2. **Preserve logs.** Capture relevant `ai_review_logs`, `notification_events`,
   Vercel logs, and Supabase logs **before** they roll off or get overwritten.
3. **Identify the user/org.** Pin down exactly which organization and which
   customer rows are affected. Scope the blast radius.
4. **Fix on a branch.** Never patch directly on `main` in a panic. Branch, make
   the change, and open a PR (the hardening work already follows this pattern —
   e.g. PR #1 from `reviewloop-alpha-hardening-validation`).
5. **Test.** Run the suite before deploying: `npm run typecheck`, `npm run lint`,
   `npm run test` (vitest), `npm run test:e2e` (playwright smoke), and
   `npm run build`. Baseline today is **85 unit tests pass, 4 Playwright smoke
   tests pass, `tsc --noEmit` clean, eslint clean, `next build` green (21
   routes)** — regressions against that baseline are red flags.
6. **Deploy.** Ship the merged fix through the normal Vercel pipeline.
7. **Document.** Write down what happened, the cause, the fix, and any follow-up.
8. **Notify the customer if needed.** If a real beta business was affected
   (especially their data), tell them plainly.

**Hard rules:**

- **Never force-push.** Never rewrite history. No `git push --force`, no
  history rebasing on shared branches — recovery and audit depend on intact
  history.
- Keep PR #1 and its branch intact; it is **not** auto-merged and should be
  merged deliberately, not slammed through during an incident.

---

## 5. Privacy / Compliance Incidents

These are **CRITICAL** by default. Treat any of the following as a stop-the-line
event and act immediately.

| Incident | Immediate action |
|----------|------------------|
| **Customer data leakage** | Pull the leaking surface offline (env disable / take route down), preserve logs, scope which rows/orgs were exposed, then fix on a branch |
| **Wrong-org access** (RLS gap) | Treat as a security bug; verify RLS on the affected table, reproduce against `0002_rls.sql`, block the path until patched |
| **Opt-out ignored** | Stop any further messaging to that customer immediately; confirm the manual opt-out flag on the `customers` row; correct and re-verify |
| **Fake / incentivized review copy** | Remove the offending copy at once; this violates hard scope (no fake reviews, no gating, no incentivized reviews). Audit how it got there |
| **Sensitive review response** | Unpublish/withdraw the AI draft or reply; review tone/escalation settings in `/app/settings`; route to owner approval before anything goes out |

Cross-cutting immediate actions for every privacy/compliance incident:

1. Contain first (disable the path), investigate second.
2. Preserve `notification_events` and `ai_review_logs` evidence.
3. Identify affected org(s) and customer(s) precisely.
4. Notify affected customers when their data or reputation was at risk.
5. Document the root cause and the guardrail that should have caught it.

> Compliance posture is a **feature**, not an afterthought. The product is
> owner-approved by design (nothing auto-posts) and opt-out is manual. If an
> incident exists because automation overrode a human decision, that automation
> should not exist in v1.

---

## 6. Rollback Plan

Roll back along the smallest blast radius that restores safety.

**Vercel (fastest):**

- In the Vercel dashboard, **promote the previous good deployment** to
  production. This is the first-line rollback for a bad ship.

**Database (be cautious):**

- Migrations apply in this exact order:
  `supabase/migrations/0001_init.sql` → `0002_rls.sql` → `0003_alpha_columns.sql`.
- **`0003` is additive / non-destructive**, so reverting app code that doesn't
  use new columns is usually safe without touching the schema.
- Do **not** casually drop columns or roll back schema during an incident —
  prefer rolling back the *app* and leaving additive schema in place. Treat any
  destructive migration as its own reviewed change.

**Feature disable via env (degrade to mock/disabled):**

- Most integrations are optional and **degrade gracefully** when unset:
  - Unset / change `AI_PROVIDER` back to `mock` (or remove `OPENAI_API_KEY` /
    `ANTHROPIC_API_KEY`) to take a misbehaving AI vendor out of the path.
  - Unset `RESEND_API_KEY` (and `FROM_EMAIL`, legacy `RESEND_FROM_EMAIL`) to
    disable email.
  - Unset the `TWILIO_*` vars to disable SMS copy generation paths.
  - Billing requires `SUPABASE_SERVICE_ROLE_KEY` + the `STRIPE_*` vars; only the
    two `NEXT_PUBLIC_SUPABASE_*` vars are strictly required for the app to run.
- After changing env, re-run `npm run verify:env` (it never prints secret
  values; it fails only when a var required for the selected mode is missing).

**Manual workaround:**

- Because v1 is manual/link-based, most workflows have a human fallback. If AI
  drafting is down, owners can still compose replies by hand in
  `/app/reviews/[id]`. If email is down, request copy can be sent by the owner
  directly. Lean on these to keep customers unblocked while you fix root cause.

---

## 7. Beta Tracking Sheet

Track every beta business here. Update after each touchpoint.

| Business | Industry | Contact | Demo date | Paid? | Plan | Reviews processed | Replies copied | Testimonials created | Objections | Next step |
|----------|----------|---------|-----------|-------|------|-------------------|----------------|----------------------|------------|-----------|
| Sunshine Plumbing (Demo) | Plumbing | demo@reviewloop.test | — | No | — | 5 | 5 | 1 | Seed/demo org only | Use for live demos |
|  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |

Plan reference for the **Plan** column: **Starter** $19/mo (50 requests/mo),
**Pro** $49/mo (250), **Business** $99/mo (1,000), **Agency** $199/mo
(placeholder, multi-business), plus a one-time **$99 setup**.

> The demo row comes from `npm run seed` — org **"Sunshine Plumbing (Demo)"**
> with 8 customers, 5 reviews (ratings 5, 5, 4, 3, 2), a reply draft per review,
> a negative-review alert, an approved testimonial, and a social post. Demo
> login: `demo@reviewloop.test` / `ReviewLoopDemo123!`. Seed is a **local/ops
> script** (needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) and
> does **not** run during a Vercel build.
