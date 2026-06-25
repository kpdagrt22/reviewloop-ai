# Supabase Production Runbook

This is a practical, checkbox-driven runbook for standing up the **ReviewLoop AI** Supabase backend, from creating the project through capturing your first real review. Work top to bottom — each `- [ ]` is a discrete step you can check off.

ReviewLoop AI is a Next.js App Router + TypeScript + Tailwind app with a Supabase backend. v1 is a manual, link-based review workflow (no Google Business Profile API). Nothing auto-posts; every AI draft is owner-approved before it goes anywhere. The AI provider is abstracted: `mock` (default, no key), `openai`, or `anthropic`.

> **Scope note:** This runbook covers Supabase setup only (project, env, migrations, RLS, auth, seed, first-run). It does not configure Stripe billing, Resend email, or Twilio — those are optional and degrade to disabled/mock when their env vars are absent.

---

## 1. Create the Supabase project and copy credentials

- [ ] Create a new project at [app.supabase.com](https://app.supabase.com). Pick a region close to your users and set a strong database password (store it in your password manager).
- [ ] Copy the **Project URL** (Project Settings → API → Project URL). This is your `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] Copy the **anon public key** (Project Settings → API → Project API keys → `anon` `public`). This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`. It is safe to expose to the browser.
- [ ] Copy the **service_role key** (Project Settings → API → Project API keys → `service_role` `secret`). This is your `SUPABASE_SERVICE_ROLE_KEY`.

### Keep the service_role key server-only

- [ ] **Never** prefix the service role key with `NEXT_PUBLIC_`. Anything `NEXT_PUBLIC_*` is inlined into the client bundle and shipped to every browser.
- [ ] **Never** reference `SUPABASE_SERVICE_ROLE_KEY` from client components, hooks, or any code that runs in the browser. It bypasses Row Level Security and grants full read/write to every table.
- [ ] Store it only in server-side env (`.env.local` for local dev, Vercel project env vars for production). It is used by the seed script and the Stripe webhook route — both server-only.

> If the service_role key is ever exposed publicly, rotate it immediately in Project Settings → API.

---

## 2. Local environment setup (`.env.local`)

The only **strictly required** vars are the two `NEXT_PUBLIC_SUPABASE_*` values. `AI_PROVIDER` defaults to `mock`, so you need no AI key to run locally.

- [ ] Copy the example file:

  ```bash
  cp .env.example .env.local
  ```

- [ ] Fill in the three Supabase values:

  ```dotenv
  NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
  ```

- [ ] Set the AI provider to mock so no API key is needed:

  ```dotenv
  AI_PROVIDER=mock
  ```

- [ ] Verify the environment loads correctly:

  ```bash
  npm run verify:env
  ```

  `verify:env` (`tsx scripts/verify-env.ts`) never prints secret values. It exits `1` only when a var required for the selected mode is missing — for mock mode, that means it checks for the Supabase vars and passes.

> `FROM_EMAIL` also accepts the legacy name `RESEND_FROM_EMAIL` if you already have that set.

---

## 3. Vercel environment setup

Set the same Supabase vars in your Vercel project, plus the public app URL.

- [ ] In Vercel → Project → Settings → Environment Variables, add:

  | Variable | Notes |
  |---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | Required |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required |
  | `SUPABASE_SERVICE_ROLE_KEY` | Server-only — do **not** mark public |
  | `AI_PROVIDER` | `mock` unless you set a real provider + key |
  | `NEXT_PUBLIC_APP_URL` | Your production URL, e.g. `https://app.yourdomain.com` |

- [ ] Apply these to the **Production** environment (and Preview if you use preview deploys).
- [ ] Add `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` only if `AI_PROVIDER` is set to `openai` / `anthropic`. Add `STRIPE_*` + `SUPABASE_SERVICE_ROLE_KEY` only when enabling billing. All other integrations are optional and degrade to mock/disabled.

> The seed script does **not** run during a Vercel build. Seeding is a local/ops task (see Section 9).

---

## 4. Apply migrations

Migrations live in `supabase/migrations/`. Apply them in this **exact order** — `0003` depends on tables created in `0001`:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_alpha_columns.sql` (additive / non-destructive)

Use **either** the CLI (4A) **or** the SQL editor (4B) — not both.

### 4A. Via the Supabase CLI (recommended)

- [ ] Link your local repo to the remote project:

  ```bash
  supabase link --project-ref <your-project-ref>
  ```

  (Your `<project-ref>` is the subdomain in your Project URL, e.g. `abcdwxyz` in `https://abcdwxyz.supabase.co`.)

- [ ] Push all pending migrations in order:

  ```bash
  supabase db push
  ```

  The CLI applies `0001` → `0002` → `0003` automatically by filename order.

### 4B. Via the SQL editor (manual fallback)

- [ ] Open Supabase → SQL Editor.
- [ ] Paste and run the full contents of `0001_init.sql`. Confirm success.
- [ ] Paste and run the full contents of `0002_rls.sql`. Confirm success.
- [ ] Paste and run the full contents of `0003_alpha_columns.sql`. Confirm success.

> Run them one at a time, in order, and wait for each to succeed before the next. Do not paste all three at once.

---

## 5. Verify the 14 tables exist

- [ ] In Supabase → Table Editor (or SQL Editor), confirm all 14 tables are present:

  | # | Table | # | Table |
  |---|---|---|---|
  | 1 | `organizations` | 8 | `testimonials` |
  | 2 | `organization_members` | 9 | `social_posts` |
  | 3 | `customers` | 10 | `notification_events` |
  | 4 | `review_campaigns` | 11 | `ai_review_logs` |
  | 5 | `message_templates` | 12 | `subscriptions` |
  | 6 | `review_requests` | 13 | `profiles` |
  | 7 | `reviews` | 14 | `ai_reply_drafts` |

- [ ] Quick SQL check of the count:

  ```sql
  select count(*) from information_schema.tables
  where table_schema = 'public';
  ```

---

## 6. Verify RLS is enabled

Row Level Security must be on for **all** tables.

- [ ] In Supabase → Authentication → Policies, confirm each table shows RLS enabled with policies attached.
- [ ] Spot-check via SQL — `relrowsecurity` should return `true`:

  ```sql
  select relrowsecurity from pg_class where relname = 'customers';
  ```

- [ ] Optionally check every table at once:

  ```sql
  select relname, relrowsecurity
  from pg_class
  where relnamespace = 'public'::regnamespace
    and relkind = 'r'
  order by relname;
  ```

  Every row should read `true`.

---

## 7. Verify policies (subscriptions is read-only for members)

- [ ] Confirm `subscriptions` is **member-READ-ONLY**: organization members can `SELECT` their subscription, but there are **no** member `INSERT`/`UPDATE`/`DELETE` policies. Writes happen only via the service-role Stripe webhook.

  ```sql
  select policyname, cmd
  from pg_policies
  where tablename = 'subscriptions';
  ```

  You should see a `SELECT` policy scoped to members and no member-facing write policies.

- [ ] Confirm the other tables scope access to the user's organization membership (a user only sees rows for orgs they belong to). The `0002_rls.sql` migration defines these.

---

## 8. Configure auth redirect / callback URLs

In Supabase → Authentication → URL Configuration:

- [ ] Set the **Site URL** to your production app URL (the same value as `NEXT_PUBLIC_APP_URL`), e.g. `https://app.yourdomain.com`.
- [ ] Add the **production callback URL** to Redirect URLs, e.g. `https://app.yourdomain.com/**` (or your exact auth callback path).
- [ ] Add the **local callback URL** to Redirect URLs: `http://localhost:3000` (and `http://localhost:3000/**`).
- [ ] Save. Without the local entry, OAuth/magic-link redirects fail during local development.

---

## 9. Seed the demo data and user

The seed script (`npm run seed`, `tsx scripts/seed.ts`) is a **local/ops** script. Run it from a machine that has the service role key — it does **not** run during a Vercel build.

- [ ] Ensure your environment has both:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

- [ ] Run the seed:

  ```bash
  npm run seed
  ```

  This creates the demo org **"Sunshine Plumbing (Demo)"** with:
  - 8 customers
  - 5 reviews (ratings 5, 5, 4, 3, 2)
  - one AI reply draft per review
  - a negative-review alert
  - one approved testimonial
  - one social post

### Demo login

- [ ] Log in with the seeded demo account to confirm the data is visible:

  | Field | Value |
  |---|---|
  | Email | `demo@reviewloop.test` |
  | Password | `ReviewLoopDemo123!` |

> Use the demo account for smoke testing only. Create real accounts (below) for actual use.

---

## 10. First real-user onboarding flow

Walk through the real product flow once to confirm production is healthy. Use only the real app routes below.

- [ ] **Create your first real user** — sign up at `/signup`.
- [ ] **Create your first organization** — complete `/onboarding`.
- [ ] **Add review links** — open `/app/settings` and set your review links, tone, and escalation email.
- [ ] **Add your first customer** — go to `/app/customers` (single add, or CSV import).
- [ ] **Create your first review request** — go to `/app/requests`, compose, and copy/send (staged as `ready`).
- [ ] **Capture your first review** — go to `/app/reviews/new` for manual review capture.

After capture, open the review at `/app/reviews/[id]` to see the AI analysis, draft reply, and testimonial/social options. Remember: **nothing auto-posts** — social copy at `/app/social` is copy-only, and `clicked` is a manual status (there is no public customer-facing redirect route in v1).

> **Sample reviews for a quick smoke test:**
> - **Positive (rating 5):** "Great service. The technician arrived on time, explained the repair clearly, and fixed the issue quickly. Highly recommend."
> - **Negative (rating 2):** "The appointment was delayed and I had to call twice for an update. The repair was fine, but communication could have been better."

---

## 11. Troubleshooting common Supabase errors

| Symptom | Likely cause | Fix |
|---|---|---|
| Queries return **"no rows"** even though data exists | The signed-in user is **not a member** of the org that owns the rows; RLS correctly hides them | Confirm there is a row in `organization_members` linking the user to the org. Complete `/onboarding` to create the membership, or add the user to the org. |
| `supabase db push` reports **"no changes"** | All migrations are already applied to the remote DB | This is expected after a successful push. Confirm with the table check in Section 5; no action needed. |
| **Seed fails with an auth/permission error** | `SUPABASE_SERVICE_ROLE_KEY` is missing or wrong (the seed needs service-role to bypass RLS and create the auth user) | Set a valid `SUPABASE_SERVICE_ROLE_KEY` in the environment you run the seed from, then re-run `npm run seed`. |
| **Local login blocked** right after signup | Email confirmation is required, and the local user's email is unconfirmed | Either disable email confirmation for local dev (Authentication → Providers → Email), or confirm the user manually in Authentication → Users. The seeded `demo@reviewloop.test` user is already confirmed. |
| RLS error on writing to `subscriptions` | `subscriptions` is member read-only by design | Do not write to it from the app. Subscription rows are written only by the service-role Stripe webhook. |

---

## 12. Rollback strategy

Migrations in this project are **forward-only and additive**. There is no down-migration path in production.

- [ ] **Prefer forward fixes.** If a schema change is wrong, write a new additive migration (e.g. `0004_...`) that corrects it. Do **not** attempt to hand-roll a destructive rollback against production.
- [ ] **`0003_alpha_columns.sql` is safe to re-run** — it is additive/non-destructive. Re-applying it will not drop data.
- [ ] **Never run `supabase db reset` against production.** `supabase db reset` drops and recreates the database from scratch — it is destructive and intended for **local/dev only**.
- [ ] If a migration partially failed in the SQL editor, fix the offending statement and re-run forward; verify the table/RLS checks in Sections 5–7 afterward.
- [ ] Treat the production database as append-forward. Back up (Supabase → Database → Backups) before any non-trivial manual change.

---

### Quick reference

| Task | Command |
|---|---|
| Verify env | `npm run verify:env` |
| Link project | `supabase link --project-ref <ref>` |
| Apply migrations | `supabase db push` |
| Seed demo data | `npm run seed` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit tests | `npm run test` |
| E2E smoke | `npm run test:e2e` |

**Verified status at release:** 85 unit tests pass · 4 Playwright smoke tests pass · `tsc --noEmit` clean · ESLint clean · `next build` green (21 routes) · `verify:env` works.
