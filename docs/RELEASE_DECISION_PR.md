# Release Decision — Alpha PR #1

**PR:** https://github.com/kpdagrt22/reviewloop-ai/pull/1
**Branch:** `reviewloop-alpha-hardening-validation` → `main` · **Not auto-merged.**

## 1. Is the alpha PR safe to merge?
**SAFE WITH WARNINGS** — merge once CI is green on the latest commit and after
human review. The warnings below are intentional, documented v1 scope limits, not
defects. No CRITICAL/HIGH blockers remain.

## 2. Evidence
| Check | Result |
|---|---|
| Unit tests (`npm test`) | **85 passed** (11 files) |
| E2E (`npx playwright test`) | **4 passed** (after fixing a stale hero assertion — see warnings) |
| Typecheck (`tsc --noEmit`) | clean |
| Lint (`npm run lint`) | clean |
| Build (`npm run build`) | green, 21 routes |
| `npm run verify:env` | works — reports required Supabase vars missing (exit 1) by design without `.env.local` |
| Security audit | `docs/FINAL_REVIEWLOOP_RELEASE_AUDIT.md` — 16/16 PASS |
| Compliance audit | included above + `docs/COMPLIANCE.md`; no fake reviews / gating / auto-post |
| Manual diff review | `docs/RELEASE_PR_REVIEW.md` — 21 areas PASS (1 test fix) |
| CI status | runs on PR (verify + e2e); **merge only when both are green** |

A code fix was made in this task: the Playwright landing-hero assertion still
referenced the old "5-star" copy that was softened to "genuine reviews" for
compliance. The assertion was corrected to the current copy (not silenced); E2E
now passes. This is included in the release-package commit, whose push
re-triggers CI.

## 3. Warnings (accepted v1 scope)
- First-org scoping only; no org switcher.
- Agency multi-business support is a placeholder.
- `clicked` request status is manual; no public click-tracking redirect.
- STOP is advisory copy; no inbound-SMS automation.
- Full authenticated E2E is logic-tested + documented, not browser-automated.
- Stripe billing checkout/webhook are functional placeholders.
- Usage limits only block when Stripe is configured (soft quota otherwise).
- Real OpenAI/Anthropic output is not verified unless a key is configured and
  exercised (mock is the default and is what's tested).

## 4. Required before production-alpha
- [ ] Create a Supabase project (`docs/SUPABASE_PRODUCTION_RUNBOOK.md`).
- [ ] Apply migrations `0001` → `0002` → `0003`.
- [ ] Configure env vars (`.env.example`, `docs/ENVIRONMENT_MATRIX.md`).
- [ ] Deploy to Vercel (`docs/VERCEL_DEPLOYMENT_RUNBOOK.md`).
- [ ] Run the production smoke test (`docs/PRODUCTION_SMOKE_TEST.md`).
- [ ] Seed the demo (`npm run seed`) for demos.

## 5. Required before paid customers
- [ ] Run a real business demo (`docs/DEMO_SCRIPT.md`).
- [ ] Confirm the messaging-consent workflow with the business.
- [ ] Test Resend email if using negative-review escalation (`FROM_EMAIL`).
- [ ] Decide the manual payment method until billing is finalized.
- [ ] Process the first 3 real reviews manually with the owner.

## 6. Human action
1. Wait for CI to go green on the latest commit.
2. Merge PR #1 via GitHub **after** CI passes and review (no force, no bypass).
3. Deploy (Supabase + Vercel runbooks).
4. Run the production smoke test; seed the demo user.
5. Start beta outreach to HVAC/plumbing/cleaning/salon businesses
   (`docs/BETA_SERVICE_BUSINESS_OPERATIONS.md`).
6. Track validation metrics; apply `docs/GO_NO_GO_FRAMEWORK.md`.
