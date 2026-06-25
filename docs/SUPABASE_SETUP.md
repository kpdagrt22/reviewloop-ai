# Supabase Setup

ReviewLoop uses Supabase for Postgres, Auth, and Row Level Security. This guide
covers local and production setup, migrations, RLS verification, and seeding.

## 1. Create a Supabase project
- Go to [supabase.com](https://supabase.com) → New project. Pick a region near
  your users. Save the database password.

## 2. Copy the keys (Project Settings → API)
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Keep the service role server-only
The service_role key **bypasses RLS**. It is used only server-side (the Stripe
webhook and the `npm run seed` script). Never put it in a `NEXT_PUBLIC_*` var or
reference it from a client component.

## 4. Local env
```bash
cp .env.example .env.local
# Fill in the three Supabase values. Leave AI_PROVIDER=mock.
npm run verify:env      # confirms required vars are set (never prints secrets)
```

## 5. Production env (Vercel)
Add the same vars in Vercel → Project → Settings → Environment Variables. Set
`NEXT_PUBLIC_APP_URL` to your deployed URL. See `docs/DEPLOYMENT.md`.

## 6. Run migrations (in order)
Migrations live in `supabase/migrations/`:
- `0001_init.sql` — tables, triggers (`set_updated_at`, profile + owner-member).
- `0002_rls.sql` — enables RLS + org-scoping policies.
- `0003_alpha_columns.sql` — additive columns (yelp/trustpilot/default channel,
  `reviews.review_request_id`, `ai_reply_drafts.updated_at`). Non-destructive.

Apply with the Supabase CLI:
```bash
supabase link --project-ref <your-ref>
supabase db push          # applies pending migrations
# Local dev only — recreate from scratch (also runs supabase/seed.sql if present):
supabase db reset
```
Or paste each file into the SQL editor and run them in order.

## 7. Verify tables
In the Table editor you should see all 14 tables: `profiles`, `organizations`,
`organization_members`, `customers`, `review_campaigns`, `message_templates`,
`review_requests`, `reviews`, `ai_reply_drafts`, `testimonials`, `social_posts`,
`notification_events`, `ai_review_logs`, `subscriptions`.

## 8. Verify RLS is enabled
- Authentication → Policies: every table above should show **RLS enabled** with
  org-scoped policies. `subscriptions` is **select-only** for members (writes
  come only from the Stripe webhook via the service role).
- Spot check: `select relrowsecurity from pg_class where relname = 'customers';`
  should return `true`.

## 9. Configure Auth redirect URLs
- Authentication → URL Configuration: add your site URL and
  `http://localhost:3000` for local. For a frictionless local/demo flow you may
  disable "Confirm email" so sign-up returns a session immediately.

## 10. Storage
Not required for v1 — ReviewLoop is text-only (no file uploads). If a future
feature needs Storage, create a bucket and add storage RLS policies, then
document them here.

## 11. Seed demo data
```bash
npm run seed
# Creates "Sunshine Plumbing (Demo)" with customers, reviews, drafts, a
# negative alert, a testimonial, and a social post.
# Login: demo@reviewloop.test / ReviewLoopDemo123!
```
Re-running reseeds cleanly (deletes the demo org via cascade, reuses the user).

## 12. Create your first real user
Sign up at `/signup`, complete onboarding (business + review links), and you land
on `/app`. The DB trigger creates the `profiles` row and the owner membership.

## 13. Test onboarding
Add a customer → create a review request → paste a review → confirm an AI reply
draft appears and negatives are flagged. (Full walk-through in `docs/DEMO_SCRIPT.md`.)

## 14. Troubleshooting
- **Queries return nothing / "not a member"** — RLS is working; ensure you're
  signed in and your user has an `organization_members` row (created on org
  creation). Re-run onboarding if needed.
- **`supabase db push` says no changes** — migrations already applied; check the
  `supabase_migrations` schema.
- **Seed fails with auth error** — confirm `SUPABASE_SERVICE_ROLE_KEY` is set and
  correct; the seed needs the service role to create the demo user.
- **Email confirmation blocks login locally** — disable "Confirm email" in Auth
  settings for local/demo, or confirm via the emailed link.
