# Architecture

## Overview
ReviewLoop is a single Next.js (App Router) application backed by Supabase
(Postgres + Auth + RLS). All integrations (AI, email, SMS, billing) sit behind
small abstractions and degrade to mock/"not configured" when keys are absent.

```
Browser ──► Next.js App Router ──► Supabase (Postgres + Auth, RLS-scoped)
                 │
                 ├─ AI provider abstraction ── mock | OpenAI | Anthropic
                 ├─ Email adapter ──────────── Resend | mock
                 ├─ SMS adapter ────────────── Twilio | mock
                 └─ Billing ────────────────── Stripe | "not configured"
```

## Rendering & data flow
- **Marketing/auth pages** (`/`, `/pricing`, `/login`, `/signup`) render without
  Supabase configured.
- **Authenticated app** (`/app/**`, `/onboarding`) is `force-dynamic`: each
  request reads the auth session + org via cookies. No static prerender.
- **Server Components** fetch data with the cookie‑bound Supabase server client,
  so **RLS** scopes every read to the user's organization.
- **Server Actions** handle all writes (`"use server"` action files colocated
  with each route). Forms post directly to actions via React 19
  `useActionState`. Mutations call `revalidatePath`.
- **Route Handlers** (`/api/**`) cover stateless AI analysis and Stripe.
- **Admin/debug** (`/app/admin`) is an org-scoped diagnostics page: it shows
  boolean config/feature flags (never secret values), the active AI
  provider/model, per-table row counts, and recent `ai_review_logs` /
  `notification_events` for the current organization only.

## Auth & org model
- Supabase Auth issues the session; middleware (`src/middleware.ts` →
  `src/lib/supabase/middleware.ts`) refreshes it and guards `/app` + `/onboarding`.
- A DB trigger creates a `profiles` row per `auth.users` row.
- Creating an `organizations` row triggers an `organization_members` row making
  the creator the `owner`.
- `src/lib/auth/session.ts` exposes `requireUser`, `getActiveOrg`, `requireOrg`
  (redirects to `/onboarding` if the user has no org yet). v1 assumes one active
  org per user (the first they belong to).

## AI abstraction
- `src/lib/ai/service.ts#getAIProvider()` selects a provider from `AI_PROVIDER`,
  falling back to mock if the chosen key is missing.
- All providers implement `AIProvider` (`analyzeReview`, `summarize`) and return
  data validated against `reviewAnalysisSchema` (Zod) — validation at the
  boundary means the rest of the app trusts the shape.
- `src/lib/reviews/analyze.ts#analyzeAndPersist()` orchestrates: run analysis →
  update review sentiment/status → insert a **pending** reply draft → insert a
  notification event if escalated → log the call to `ai_review_logs`. Prohibited
  content (legal fault / incentives) is scrubbed defensively.

## Business logic (pure, testable)
Kept provider/DB‑independent so it is unit‑tested directly:
- `lib/reviews/rules.ts` — escalation rule, testimonial eligibility, sentiment
  mapping, prohibited‑content detection.
- `lib/reviews/request-status.ts` — review‑request state machine.
- `lib/reports/weekly.ts` — report calculator.
- `lib/messaging/eligibility.ts` — consent/opt‑out gating.
- `lib/customers/csv.ts` — CSV import parser.

## Integrations (graceful degradation)
| Concern | Live | Fallback |
| --- | --- | --- |
| AI | OpenAI / Anthropic (REST, no SDK) | deterministic mock |
| Email | Resend | console log, request still recorded |
| SMS | Twilio | console log, request still recorded |
| Billing | Stripe (dynamic import) | "Billing not configured" UI, 501 routes |

`src/lib/env.ts` centralizes feature detection (`hasSupabase`, `hasResend`,
`hasTwilio`, `hasStripe`, `aiConfigured`).

## Key directories
See the project structure section in the README.

## Notable decisions
- **No AI/Stripe/Twilio SDK hard dependency.** OpenAI/Anthropic use `fetch`;
  Stripe/Twilio/Resend are optional deps loaded via dynamic `import()`. The app
  builds and runs without them installed.
- **Service‑role client is server‑only** (`src/lib/supabase/admin.ts`) and used
  only by the Stripe webhook to write subscription state past RLS.
- **Force‑dynamic app routes** avoid build‑time prerender failures when env
  vars are absent and guarantee per‑request auth scoping.
