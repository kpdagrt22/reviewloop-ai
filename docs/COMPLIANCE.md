# Compliance & Policy Guardrails

ReviewLoop is built to comply with review‑platform policies (notably Google) and
messaging consent law. These constraints are product requirements, not options.

## Hard rules
| Rule | How it's enforced |
| --- | --- |
| **Do not create fake reviews** | The product has no path to author/post a review. It only requests real reviews and drafts *replies*. |
| **Do not incentivize only positive reviews** | The default request message asks for honest feedback and points everyone to the same link. No "leave us 5 stars for X". |
| **Do not gate negative reviews deceptively** | There is no review‑gating/“filter” step. Every customer gets the same neutral ask. |
| **Do not auto‑post replies** | All replies/testimonials/social posts are **drafts**. The owner copies and posts them manually. `ai_reply_drafts` start in `draft`. |
| **Do not violate Google review policies** | Neutral request copy; no pressure; no selective routing. |
| **No SMS/email without permission** | `canMessage()` requires channel consent (`consent_email`/`consent_sms`) and blocks any messaging when `opt_out` is set. |
| **Unsubscribe / opt‑out** | `customers.opt_out` is respected everywhere and enforced **server‑side** for all channels (incl. manual) in `requests/actions.ts`; the customers page can toggle it; the default request copy includes opt‑out (STOP) language; outbound **emails** carry a one‑click unsubscribe link (`/optout/<token>`) that a customer can use without logging in. |
| **Right to reuse customer words** | Turning a review into a testimonial/social post shows a disclaimer reminding the owner they must have the customer's permission to publish their words and name. Surfaced in the testimonial composer and the Social posts page. |
| **Negative reviews → professional response, not retaliation** | AI prompt + rules push acknowledge‑and‑resolve‑offline; prohibited‑content scrub blocks legal‑fault admissions and incentives. |
| **No medical/legal claims for clinics** | Prompt forbids fabricating facts / admitting fault; replies stay professional and non‑clinical. |
| **Protect customer privacy** | Prompt + UI disclaimer forbid including private customer details in public replies. |

## Where each rule lives in code
- Consent / opt‑out: `src/lib/messaging/eligibility.ts` (`canMessage`,
  `eligibleCustomers`) — unit‑tested in `tests/unit/eligibility.test.ts`.
- Neutral request copy: `src/lib/messaging/templates.ts`
  (`DEFAULT_REQUEST_BODY`) — tested in `tests/unit/csv-and-templates.test.ts`.
- Escalation (negative handling): `src/lib/reviews/rules.ts#shouldEscalate` —
  tested in `tests/unit/rules.test.ts`.
- No auto‑post: drafts created in `draft` status in
  `src/lib/reviews/analyze.ts`; UI only ever offers copy / mark‑posted.
- Prohibited reply content: `containsProhibitedReplyContent` + scrub in
  `analyzeAndPersist`.

## Public opt-out flow
- Outbound emails include `…/optout/<token>`. The token is an HMAC over the
  customer id (`src/lib/compliance/optout-token.ts`), so it can't be forged for
  another customer and needs no stored token column.
- The page (`src/app/optout/[token]`) verifies the token and, on confirm, sets
  `opt_out = true` via the service-role client (no login required).
- Requires `SUPABASE_SERVICE_ROLE_KEY` (to apply the change) and a signing key
  (`OPTOUT_SECRET`, else falls back to the service-role key). If neither is set,
  the link is omitted and the STOP language still applies.

## Messaging consent checklist (for onboarding & operations)
1. Only add customers who agreed to be contacted; record consent per channel.
2. Include the business identity and a way to opt out in messages.
3. Honor opt‑out immediately and permanently (set `opt_out = true`).
4. Keep the ask neutral — never condition the request on a positive review.

## Owner responsibilities (surfaced in‑product)
- Review every AI draft before posting; remove anything private or inaccurate.
- Respond to negative reviews professionally; prefer resolving offline.
- Do not offer rewards in exchange for changing/removing a review.

> This document is descriptive of the product's guardrails. It is not legal
> advice. Businesses remain responsible for compliance with local law (e.g.
> TCPA, CAN‑SPAM, GDPR/ePrivacy, CASL) and platform terms.
