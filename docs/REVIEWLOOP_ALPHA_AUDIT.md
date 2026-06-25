# ReviewLoop AI — Alpha Current-State Audit (Phase 1)

**Date:** 2026-06-26
**Branch:** `reviewloop-alpha-hardening-validation`
**Method:** 8-dimension parallel audit by independent reviewers reading the real
codebase, each finding grounded in `file:line` evidence.

**Overall:** 5 PASS · 3 WARN · 0 FAIL. The MVP is functionally complete and
demo-capable on mock AI. Gaps are concentrated in (a) the domain schema (missing
columns), (b) validation enablement (no seed/demo/outreach assets), and (c) a few
compliance/UX hardening items. All are addressed in this task except where noted.

Legend — Severity: LOW / MED / HIGH / CRITICAL. **Fixed?** = fixed in this task.

---

## 1. Feature Completeness — PASS
Every v1 feature exists and is wired end-to-end (landing, auth, onboarding, org
setup, review links, customers + consent, request workflow, manual capture,
mock/real AI analysis, reply drafts, negative detection, testimonials, social
drafts, weekly report, pricing, Stripe placeholders, docs, tests).

| Issue | Sev | File | Fix | Fixed? |
|---|---|---|---|---|
| Social-post drafts persist to `social_posts` but have no listing page | LOW | `src/app/app/reviews/actions.ts:156` | Add `/app/social` page listing saved posts + sidebar link | ✅ Yes |
| Review links are org-level only; no public `/r` redirect to track clicks | LOW | `src/app/app/requests/actions.ts:21` | Out of v1 scope (no Google API). Documented as manual-only `clicked` | ⚠️ Documented (by design) |

## 2. Review Workflow Readiness — PASS
Add customer → capture consent → create/copy/send request → paste review → AI
analyze → AI reply draft → edit/copy → escalate negative → testimonial/social
from positive: all functional.

| Issue | Sev | File | Fix | Fixed? |
|---|---|---|---|---|
| No customer **edit** (add-only; a typo can't be corrected in UI) | MED | `src/app/app/customers/actions.ts` | Add `editCustomerAction` + edit form, org-scoped update | ✅ Yes |
| No `ready`/queued status to stage a request before sending | LOW | `src/lib/reviews/request-status.ts:6` | Add `ready` to statuses + transitions; allow "Save as ready" | ✅ Yes |

## 3. Compliance Readiness — PASS (with hardening)
No fake reviews, no gating, no auto-post, consent + opt-out enforced server-side
(incl. manual channel), neutral request copy, owner approval required,
prohibited-content scrub on AI replies, reply-privacy disclaimer present.

| Issue | Sev | File | Fix | Fixed? |
|---|---|---|---|---|
| Testimonial/social composer lacks a "right to reuse customer words" disclaimer | MED | `src/app/app/reviews/[id]/testimonial-composer.tsx` | Add reuse-rights disclaimer in composer + testimonials page + COMPLIANCE.md row | ✅ Yes |
| Landing hero "Get more 5-star reviews" could read as selective solicitation | LOW | `src/app/page.tsx:41` | Soften hero to "more genuine 5-star reviews … from every happy customer" | ✅ Yes |

## 4. Security Readiness — PASS
RLS enabled on all 14 tables; org-scoped policies via `is_org_member()`
(SECURITY DEFINER, pinned search_path); every server action filters
`organization_id` on top of RLS; `subscriptions` is member-read-only (writes only
via service-role webhook); service role never imported in `"use client"` files;
Stripe webhook verifies signature; middleware + `requireOrg` guard `/app`.

| Issue | Sev | File | Fix | Fixed? |
|---|---|---|---|---|
| `/app/admin` gated only by org membership (no super-admin allowlist) | LOW | `src/app/app/admin/page.tsx:11` | Gate on `ADMIN_EMAILS` (fallback: org owner only) | ✅ Yes |
| No centralized ownership-assertion helpers (checks inlined per action) | MED | `src/lib/auth/session.ts` | Add `src/lib/auth/organizations.ts` with `requireOrganizationMember`, `assert*BelongsToOrg` | ✅ Yes |

## 5. AI Readiness — PASS
Mock provider deterministic + default; openai/anthropic via REST; Zod schema
validates output at the boundary; malformed output → `safeFallback` (no crash);
negative replies avoid legal fault (prompt + prohibited-pattern scrub); output is
always a draft requiring owner review.

| Issue | Sev | File | Fix | Fixed? |
|---|---|---|---|---|
| No dedicated `testimonial_text` field (only `social_post_draft`) | LOW | `src/lib/ai/schemas/review-analysis.ts:8` | Add `testimonial_text` to schema + mock + prompt | ✅ Yes |
| `reply_tone` could throw to fallback if model returns out-of-enum tone | LOW | `src/lib/ai/providers/openai.ts:47` | `reply_tone` made resilient with `.catch(brand_tone)` | ✅ Yes |
| Prohibited-content scrub doesn't flag the AI log | LOW | `src/lib/reviews/analyze.ts:62` | Record `scrubbed` status/flag in `ai_review_logs` | ✅ Yes |

## 6. Supabase Readiness — WARN
Migrations exist + ordered, RLS enabled, local/prod setup documented. Gaps:
missing columns, no seed/demo flow, Storage advertised but unused.

| Issue | Sev | File | Fix | Fixed? |
|---|---|---|---|---|
| 6 required columns missing (org yelp/trustpilot/default_request_channel; reviews.review_request_id; ai_reply_drafts.updated_at + trigger) | **HIGH** | `supabase/migrations/0001_init.sql` | Add additive `0003_alpha_columns.sql` + update `types.ts` | ✅ Yes |
| No seed/demo-data script | MED | `package.json` | Add `supabase/seed.sql` + sample CSV; document | ✅ Yes |
| Storage listed in stack but unused/undocumented | LOW | `README.md:26` | Remove "Storage" from stack line (no feature uses it) | ✅ Yes |

## 7. Deployment Readiness — PASS
`next build` succeeds with mock AI and zero secrets; optional integrations
degrade; no server secret in any `"use client"` file; only `.env.example`
committed; CI mirrors the deploy build.

| Issue | Sev | File | Fix | Fixed? |
|---|---|---|---|---|
| `.gitignore` ignores `.env`/`.env*.local` but not `.env.production` | LOW | `.gitignore` | Broaden to `.env*` with `!.env.example` allow | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` documented as Required (it's billing-only) | LOW | `docs/DEPLOYMENT.md:24` | Move to "Required for billing" subsection | ✅ Yes |

## 8. Validation Readiness — WARN
Strong `VALIDATION_PLAN.md` (thesis, gates, success/kill metrics, RLS test) and
mock-AI demo capability. Missing founder-facing assets.

| Issue | Sev | File | Fix | Fixed? |
|---|---|---|---|---|
| No `DEMO_SCRIPT.md` (<5-min repeatable demo) | MED | `docs/` | Add `docs/DEMO_SCRIPT.md` with exact click-path + sample reviews | ✅ Yes |
| No seed/demo data or sample CSV (demo = manual entry) | MED | `supabase/`, `package.json` | Add seed + `samples/customers.csv` | ✅ Yes |
| No outreach scripts (cold/DM/LinkedIn) to recruit businesses | MED | `docs/` | Add `docs/OUTREACH.md` | ✅ Yes |
| Willingness-to-pay is one ad-hoc question, not a protocol | LOW | `docs/VALIDATION_PLAN.md` | Expand WTP protocol + niche recommendation | ✅ Yes |

---

## Summary of fixes in this task
- **HIGH:** schema columns (migration `0003` + types).
- **MED:** customer edit; testimonial reuse disclaimer; centralized ownership
  helpers; seed/demo data; `DEMO_SCRIPT.md`; `OUTREACH.md`.
- **LOW:** `ready` status; `testimonial_text`; admin allowlist; social-posts page;
  hero copy; gitignore; deployment-doc labeling; AI scrub flag; WTP protocol;
  README storage line.

**Intentionally out of scope for v1 (documented):** public `/r` click-tracking
redirect (depends on link infrastructure, not Google-API-free manual flow);
multi-location agency complexity (placeholder only); complex SMS automation.
