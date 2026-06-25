# Deployment

ReviewLoop deploys cleanly to Vercel with a Supabase backend. Only Supabase is
required; AI/email/SMS/billing are optional and degrade gracefully.

## 1. Supabase project
1. Create a Supabase project.
2. Apply migrations (in order): `supabase/migrations/0001_init.sql`, then
   `0002_rls.sql`.
   - CLI: `supabase link --project-ref <ref>` then `supabase db push`.
   - Or paste each file into the SQL editor and run.
3. Auth → Providers: enable Email. For the smoothest flow, decide whether to
   require email confirmation (off = instant session after sign‑up).
4. Copy the Project URL, anon key, and service_role key.

## 2. Deploy the app (Vercel)
1. Import the repo into Vercel (framework auto‑detected as Next.js).
2. Set environment variables (Project → Settings → Environment Variables):

   **Required**
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=        # needed only if billing is enabled
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   AI_PROVIDER=mock                  # or openai / anthropic
   ```

   **Optional (enable as needed)**
   ```
   OPENAI_API_KEY= / ANTHROPIC_API_KEY=
   RESEND_API_KEY= / RESEND_FROM_EMAIL=
   TWILIO_ACCOUNT_SID= / TWILIO_AUTH_TOKEN= / TWILIO_MESSAGING_SERVICE_SID=
   STRIPE_SECRET_KEY= / STRIPE_WEBHOOK_SECRET= / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   STRIPE_PRICE_STARTER= / STRIPE_PRICE_PRO= / STRIPE_PRICE_BUSINESS= / STRIPE_PRICE_AGENCY=
   ```
3. Deploy. Build command `next build`, output is the default `.next`.

> The `/app/**` routes are `force-dynamic`, so the build succeeds even before
> Supabase secrets are present; they just require auth at runtime.

## 3. Supabase ↔ Vercel auth cookies
No extra config needed: the app uses `@supabase/ssr` with cookie‑based sessions
and a middleware that refreshes them. Ensure `NEXT_PUBLIC_APP_URL` matches your
deployed domain.

## 4. Stripe (only if billing is enabled)
1. Create the four subscription Prices and set `STRIPE_PRICE_*`.
2. Add a webhook endpoint pointing at `https://your-domain.com/api/stripe/webhook`
   for events: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Put the signing secret in
   `STRIPE_WEBHOOK_SECRET`.
3. The webhook writes subscription state via the service‑role client, so
   `SUPABASE_SERVICE_ROLE_KEY` must be set.
4. Without Stripe configured, the billing page shows "Billing not configured"
   and the webhook returns 501 — safe to deploy.

## 5. Post‑deploy smoke check
- Visit `/` and `/pricing` — should render.
- Sign up → onboarding → create org → land on `/app`.
- Add a customer, paste a review, confirm a draft reply appears.
- Mark a negative review and confirm it's flagged on the dashboard.

## Continuous integration
CI is configured in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) and
runs on every push/PR to `main`:
- **verify** job: `npm ci` → `npm run typecheck` → `npm run test` → `npm run build`
- **e2e** job: Playwright chromium smoke tests against the public pages

No secrets are needed for CI (the app builds with mock AI and dynamic `/app`
routes). Keep `main` green; with the Vercel ↔ GitHub integration enabled, each
push to `main` also triggers a production deploy.

### Auto-deploy via Git integration (recommended)
Import the repo once at [vercel.com/new](https://vercel.com/new) (or the
"Deploy with Vercel" button in the README). After that, pushes to `main` deploy
automatically and pull requests get preview URLs — no Vercel CLI needed.

## Rollback / migrations
Migrations are additive and idempotent where practical (`if not exists`). To
reset a local/dev DB: `supabase db reset`. For production, prefer forward
migrations over destructive resets.
