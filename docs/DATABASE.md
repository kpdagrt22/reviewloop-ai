# Database & RLS

Source of truth: [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
(schema) and [`0002_rls.sql`](../supabase/migrations/0002_rls.sql) (policies).
TypeScript mirror: [`src/lib/supabase/types.ts`](../src/lib/supabase/types.ts).

## Entity overview
All business data hangs off `organizations` and is scoped by `organization_id`.

```
auth.users ─1:1─ profiles
profiles ─1:N─ organizations (owner_id)
organizations ─1:N─ organization_members ─N:1─ profiles
organizations ─1:N─ customers
organizations ─1:N─ review_campaigns ─1:N─ message_templates
organizations ─1:N─ review_requests ─N:1─ customers, campaigns
organizations ─1:N─ reviews ─N:1─ customers
reviews ─1:N─ ai_reply_drafts
reviews ─1:N─ testimonials, social_posts
organizations ─1:N─ notification_events, ai_review_logs
organizations ─1:1─ subscriptions
```

## Tables
| Table | Purpose | Key columns / constraints |
| --- | --- | --- |
| `profiles` | User profile (1:1 with auth.users) | `id` → auth.users; auto‑created by trigger |
| `organizations` | A business | `owner_id`, review links, `brand_tone` (default `professional`), `escalation_email` |
| `organization_members` | Membership + role | `role ∈ {owner,admin,member}`, unique `(org,user)` |
| `customers` | Served customers | `consent_email`, `consent_sms`, `opt_out` |
| `review_campaigns` | Request campaigns | `channel ∈ {email,sms,manual,both}` |
| `message_templates` | Request message templates | `subject`, `body` |
| `review_requests` | Request lifecycle | `status ∈ {draft,sent,clicked,completed,cancelled}` + timestamps |
| `reviews` | Captured reviews | `rating 1..5`, `sentiment ∈ {positive,neutral,negative}`, `status ∈ {new,replied,escalated,archived}` |
| `ai_reply_drafts` | Reply drafts | `status ∈ {draft,approved,posted,discarded}`, `ai_confidence` |
| `testimonials` | Approved proof | `approved` |
| `social_posts` | Social drafts | `status ∈ {draft,approved,posted}` |
| `notification_events` | In‑app events (e.g. negative_review) | `event_type`, `metadata jsonb` |
| `ai_review_logs` | AI call audit | `provider`, `model`, `input_json`, `output_json`, `status`, `error_message` |
| `subscriptions` | Stripe state | unique per org, `plan`, `status`, `current_period_end` |

`updated_at` is maintained by the `set_updated_at()` trigger on every mutable table.

## Triggers
- `on_auth_user_created` → `handle_new_user()` inserts a `profiles` row.
- `on_organization_created` → `handle_new_organization()` inserts the owner's
  `organization_members` row (role `owner`).

## Row Level Security
RLS is enabled on **every** table. The core helper:

```sql
create function public.is_org_member(org_id uuid) returns boolean
  language sql security definer stable
  as $$ select exists (
    select 1 from organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  ); $$;
```

`SECURITY DEFINER` lets the helper read `organization_members` without
triggering that table's own RLS (avoids recursion).

### Policy summary
- **profiles** — a user may select/update/insert only their own row (`id = auth.uid()`).
- **organizations** — members may `select`; only the `owner_id = auth.uid()` may
  insert/update/delete.
- **organization_members** — a user sees their own rows + co‑members; only the
  org **owner** may add/remove members.
- **All other org‑scoped tables** (`customers`, `review_campaigns`,
  `message_templates`, `review_requests`, `reviews`, `ai_reply_drafts`,
  `testimonials`, `social_posts`, `notification_events`, `ai_review_logs`,
  `subscriptions`) — `FOR ALL USING (is_org_member(organization_id)) WITH CHECK
  (is_org_member(organization_id))`. Created in a loop in `0002_rls.sql`.

### RLS assumptions (documented & tested in spirit)
1. **No cross‑org leakage.** A request authenticated as user U can only read/write
   rows whose `organization_id` is one of U's memberships. Verified by policy:
   every table's `USING` clause calls `is_org_member`.
2. **Service role bypasses RLS** and is used **only** server‑side by the Stripe
   webhook (`src/lib/supabase/admin.ts`). It is never exposed to the browser.
3. **Defense in depth.** Server queries also filter `.eq("organization_id", org.id)`
   explicitly, so a policy regression alone cannot widen scope.
4. **Owner‑only escalation.** Membership management is restricted to the owner.

> Unit tests assert the application‑level invariants that mirror these policies
> (escalation, opt‑out, status transitions). RLS itself is enforced by Postgres;
> validate it manually with two accounts (see VALIDATION_PLAN) — account B must
> never see account A's customers/reviews.
