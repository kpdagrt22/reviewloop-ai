# ReviewLoop AI — Remaining-Roadmap Execution Status

Tracks the post-launch hardening roadmap (T1–T16) executed after the alpha
merge. "Done" means code is committed to `main`, typechecks, and is covered by
the test suite + production build. Items that need live infrastructure are
called out explicitly — they are **not** marked done from code alone.

## Status

| # | Task | Status | Notes |
|---|------|--------|-------|
| T1 | `ready` request status: DB CHECK + stop false success | ✅ Done | Migration `0004`; error now surfaced. Apply `0004` to prod DB. |
| T2 | Surface swallowed DB/send errors | ✅ Done | All fire-and-forget writes routed through `src/lib/observability/log.ts`. |
| T3 | Integration test harness + critical action tests | ✅ Done | In-memory Supabase fake; request-flow + opt-out/consent tests. |
| T4 | `analyzeAndPersist` end-to-end test | ✅ Done | Draft/sentiment/scrub/escalation/log + terminal-status guard. |
| T5 | Public opt-out route (compliance, beta blocker) | ✅ Done (code) | `/optout/<token>` + signed tokens + email link. **Needs `SUPABASE_SERVICE_ROLE_KEY` (+ optional `OPTOUT_SECRET`) in prod.** |
| T6 | App-side enum validation parity | ✅ Done | `src/lib/db/enums.ts`; channel + social status validated pre-write. |
| T7 | Missing indexes | ✅ Done | Migration `0005`. Apply to prod DB. |
| T8 | Billing: quota soft/hard + webhook error handling | ✅ Done (code+tests) | Quota tests added; webhook now returns 500 on persist failure so Stripe retries. **A live test-mode Stripe run is still a manual step (needs keys).** |
| T9 | Role granularity + resolve unused helpers | ✅ Done | Destructive testimonial/social deletes gated to owner/admin; dead `assert*BelongsToOrg` removed. |
| T10 | Staging deploy + production smoke test | ⏳ Needs infra | Code is deploy-ready. Execute `VERCEL_DEPLOYMENT_RUNBOOK.md` + `SUPABASE_PRODUCTION_RUNBOOK.md`, then `PRODUCTION_SMOKE_TEST.md`. |
| T11 | Error monitoring | ◑ Partial | Logging seam + `setExternalSink()` extension point shipped. **Wiring a real sink (e.g. Sentry) needs a DSN.** |
| T12 | Email-confirmation UX | ✅ Done | Sign-up confirmation now shown as a green notice, not a red error. |
| T13 | Rate-limit `/api/ai/analyze` | ✅ Done (best-effort) | In-memory per-org window (per-instance on serverless — see code note; back with a shared store for a hard global limit). |
| T14 | Loading/empty-state audit | ✅ Reviewed | Forms already use `useActionState` pending; lists have empty states. Auth notice added. No gaps found that block beta. |
| T15 | Admin-view audit logging | ✅ Done | `admin_diagnostics_viewed` event recorded on each authorized admin view. |
| T16 | Multi-org / agency UX | ⛔ Parked | Out of scope by prior agreement; MVP uses the first org. |

## Required human steps before beta (not code)

1. **Apply migrations** `0004_request_ready_status.sql` and `0005_indexes.sql`
   to the production Supabase database (after `0001`→`0003`). The T1 runtime fix
   does not take effect until `0004` is applied.
2. **Set env** in production: `SUPABASE_SERVICE_ROLE_KEY` (required for opt-out +
   Stripe webhook) and, ideally, a dedicated `OPTOUT_SECRET`.
3. **Deploy** (T10) and run the production smoke test.
4. **(When monetizing)** run a Stripe test-mode checkout + webhook end-to-end
   (T8) and, optionally, wire an error monitor sink (T11).

## Migration order (authoritative)

```
0001_init.sql  →  0002_rls.sql  →  0003_alpha_columns.sql
              →  0004_request_ready_status.sql  →  0005_indexes.sql
```

All migrations are additive and idempotent (safe to re-run).
