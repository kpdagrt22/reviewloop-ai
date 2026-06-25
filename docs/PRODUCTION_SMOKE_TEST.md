# Production Smoke Test

Manual, founder-usable smoke checklist for **ReviewLoop AI** (Next.js App Router +
TypeScript + Tailwind + Supabase). Run this against a freshly deployed environment
before promoting a build to customers, and after merging
[PR #1](https://github.com/kpdagrt22/reviewloop-ai/pull/1)
(`reviewloop-alpha-hardening-validation` -> `main`; not merged / not auto-merged).

This is a manual pass. Mark each row **PASS** or **FAIL** in the Result column. Any
FAIL blocks release until triaged.

## Scope & boundaries (read first)

ReviewLoop AI v1 is **manual / link-based** and **owner-approved** — nothing
auto-posts. The following are deliberate product boundaries, **not** features:

- NO fake reviews, NO review gating.
- NO social auto-posting (copy-only).
- NO Google Business Profile API.
- NO SMS automation; NO inbound-SMS STOP automation (STOP is advisory copy; opt-out
  is set manually).
- NO full CRM, NO native app, NO appointment scheduling, NO customer portal.
- Agency multi-client tier is a placeholder.
- Never claim "guaranteed 5-star reviews" or "automatic Google review posting".

There is **no** public customer-facing review redirect route (`/r/...`) in v1 —
`clicked` is a manual status.

## Pre-flight

| Item | Detail | Result |
| --- | --- | --- |
| Required env present | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` set | |
| AI provider | `AI_PROVIDER` defaults to `mock` (no key needed) | |
| Billing env (if testing billing) | `SUPABASE_SERVICE_ROLE_KEY` + `STRIPE_*` set | |
| `verify:env` | `npm run verify:env` exits 0; prints no secret values | |
| Migrations applied in order | `0001_init.sql` -> `0002_rls.sql` -> `0003_alpha_columns.sql` | |
| Build sanity | `next build` green (21 routes); `typecheck` + `lint` clean | |
| Verified baseline | 85 unit tests pass; 4 Playwright smoke tests pass | |

> `verify:env` fails (exit 1) only when a var required for the **selected mode** is
> missing. Optional integrations (Resend, Twilio, OpenAI/Anthropic) degrade to
> mock/disabled.

---

## 1. Public routes

| Check | Result |
| --- | --- |
| `/` loads with no console errors | |
| `/pricing` loads with no console errors | |
| Both pages are mobile responsive (no horizontal scroll, tap targets usable) | |
| No raw stack traces or 500s on first paint | |

## 2. Auth

| Check | Result |
| --- | --- |
| Sign up via `/signup` creates an account | |
| Log in via `/login` succeeds | |
| Logout works and clears the session | |
| Unauthenticated visit to an `/app/*` route redirects to `/login` | |
| Open-redirect blocked: `/login?next=//evil.com` stays on-site (does NOT redirect off-domain) | |
| Open-redirect blocked: `/login?next=https://evil.com` stays on-site | |

## 3. Onboarding

Run `/onboarding` end to end.

- [ ] Organization is created
- [ ] Business profile saved
- [ ] Review links saved
- [ ] Brand tone saved
- [ ] Escalation email saved
- [ ] Re-visiting `/app/settings` shows the saved values persisted

## 4. Customers

| Check | Result |
| --- | --- |
| List loads at `/app/customers` | |
| Add a customer succeeds | |
| Edit a customer via the dialog succeeds | |
| Consent fields save and persist | |
| Opt-out saves (manual; reflects on reload) | |
| Validation works (e.g. bad email / empty required fields rejected) | |
| CSV import accepts a valid file | |

## 5. Review request

Use `/app/requests`.

| Check | Result |
| --- | --- |
| Create a review request | |
| "Save as ready" stages the request in `ready` status | |
| Preview message renders | |
| Copy produces an **ethical** request (plain ask to share honest feedback) | |
| Mark sent manually updates status | |
| Copy contains **NO** 5-star manipulation / review-gating language | |

## 6. Manual review capture

Use `/app/reviews/new`.

| Check | Result |
| --- | --- |
| Rating is required | |
| Invalid rating is blocked | |
| Platform is required | |
| Review text is required | |
| Capture can link to a customer / request | |
| Linked request is marked **completed** after capture | |

## 7. AI review analysis

Review detail at `/app/reviews/[id]`. Default provider is `mock` (no key).

| Check | Result |
| --- | --- |
| Mock AI analysis runs | |
| Sentiment is shown | |
| Reply draft is shown | |
| Scrubbing of private details works (if tested) | |
| Fallback works gracefully if the AI provider fails (no crash) | |

## 8. Negative review

Capture this sample verbatim, then run analysis:

> The appointment was delayed and I had to call twice for an update. The repair was fine, but communication could have been better.

(Rating: 2)

| Check | Result |
| --- | --- |
| Sentiment is negative or neutral | |
| Escalation fires if applicable (notifies escalation email) | |
| Reply draft is professional and de-escalating | |
| Reply makes **no** admission of legal fault | |
| Reply exposes **no** private customer details | |

## 9. Positive review

Capture this sample verbatim, then run analysis:

> Great service. The technician arrived on time, explained the repair clearly, and fixed the issue quickly. Highly recommend.

(Rating: 5)

| Check | Result |
| --- | --- |
| Sentiment is positive | |
| Reply draft is generated | |
| Flagged as a testimonial candidate | |
| Social post draft is offered | |
| Reuse-rights / consent disclaimer is shown before reuse | |

## 10. Social page

Use `/app/social`.

| Check | Result |
| --- | --- |
| Drafts are visible | |
| Copy works | |
| There is **NO** auto-post button (copy-only by design) | |

## 11. Weekly report

Use `/app/report`.

| Check | Result |
| --- | --- |
| Average rating shown | |
| Rating distribution shown | |
| Review count shown | |
| Pending replies shown | |
| Negative alerts shown | |
| Testimonial candidates shown | |

## 12. Billing & pricing

| Check | Result |
| --- | --- |
| `/pricing` loads (Starter $19, Pro $49, Business $99, Agency $199 placeholder, $99 one-time setup) | |
| `/app/billing` loads | |
| Missing Stripe env is handled safely (no crash; clear disabled state) | |
| Quota UI is safe with no/partial data | |

> Plan request limits: Starter 50/mo, Pro 250/mo, Business 1,000/mo, Agency
> multi-business placeholder. Stripe + `SUPABASE_SERVICE_ROLE_KEY` are required only
> for billing.

## 13. Admin

Use `/app/admin` (gated by `ADMIN_EMAILS`, with owner fallback).

| Check | Result |
| --- | --- |
| Unauthorized (non-admin) user is blocked | |
| User listed in `ADMIN_EMAILS` can access | |
| No secrets / keys are displayed | |

## 14. Seed script (local / ops only)

Run from a machine that has `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
This does **not** run during a Vercel build.

```bash
npm run seed
```

| Check | Result |
| --- | --- |
| `npm run seed` completes locally | |
| Demo login works: `demo@reviewloop.test` / `ReviewLoopDemo123!` | |
| Seeded data visible: org "Sunshine Plumbing (Demo)", 8 customers, 5 reviews (ratings 5,5,4,3,2) | |
| Reply draft per review present; negative-review alert present | |
| One approved testimonial + one social post present | |

## 15. Mobile

| Check | Result |
| --- | --- |
| Dashboard (`/app`) usable on mobile | |
| Customer form usable on mobile | |
| Review capture (`/app/reviews/new`) usable on mobile | |
| Social page (`/app/social`) usable on mobile | |

## 16. Error handling

| Check | Result |
| --- | --- |
| No raw stack traces shown to users | |
| Errors are user-friendly | |
| Missing optional integrations (Resend / Twilio / OpenAI / Anthropic) degrade safely to mock/disabled | |
| API routes (`/api/ai/analyze`, `/api/stripe/checkout`, `/api/stripe/webhook`) fail gracefully on bad input | |

---

## Sign-off

| Field | Value |
| --- | --- |
| Build / commit | |
| Environment URL | |
| Tester | |
| Date | |
| Result (PASS / FAIL) | |
| Notes | |
