# ReviewLoop AI — Product Requirements (v1 / MVP)

## Summary
A review request, reply, reputation, and testimonial automation tool for local
service businesses. Core promise: **"Get more reviews, reply faster, and turn
happy customers into proof."**

This is not just an AI reply generator. ReviewLoop helps a business **request**
reviews, **capture** them (manually in v1), **draft replies**, **flag negative
reviews**, and **reuse positive reviews** as testimonials and social posts.

## Target users
Small service businesses in the US, EU, Canada, and Australia: plumbers,
electricians, HVAC, salons, cleaning, auto repair/detailing, dentists, local
repair shops, and small local agencies. Owners are typically non‑technical.

## MVP principle: no Google API dependency
v1 is manual/link‑based:
1. Business adds its Google (and optional Facebook/Yelp) review link.
2. App sends or copies review‑request messages.
3. Business pastes reviews it receives.
4. AI drafts replies and testimonial/social content.
5. Google Business Profile API is a **later** integration (see VALIDATION_PLAN).

## Goals
- Quick validation, low technical risk, lean SaaS MVP.
- Service‑assisted onboarding (a human can set a business up).
- Owner stays in control: nothing is auto‑posted.

## Core features
1. **Public landing page** — hero, problem/solution, use cases, how‑it‑works,
   pricing, FAQ.
2. **Auth & onboarding** — Supabase auth; collect business profile, review
   links, brand tone, escalation email, messaging consent.
3. **Database + RLS** — organization‑scoped data, no cross‑org leakage.
4. **Dashboard** — requests sent/clicked, reviews collected, average rating,
   negatives needing attention, pending replies, testimonials ready, recent
   activity, quick actions.
5. **Customers** — add/search/CSV import; consent + opt‑out tracking.
6. **Review request workflow** — templates, email/SMS (or copy), status
   tracking. Neutral ask (no positive‑only pressure, no negative gating).
7. **Manual review capture** — paste platform/rating/text/etc.
8. **AI review reply workflow** — provider abstraction (mock/openai/anthropic),
   structured analysis schema, compliance rules.
9. **Reply approval** — review original, AI analysis, editable draft, copy,
   mark posted, regenerate, disclaimer.
10. **Testimonials & social posts** — text drafts for positive reviews; edit,
    approve, copy.
11. **Negative review alerts** — flag rating ≤ 2 or high severity; notification
    event; optional escalation email; "call customer" suggestion.
12. **Weekly reputation report** — metrics + AI summary.
13. **Pricing & billing** — Stripe abstraction; "not configured" fallback.
14. **Design** — clean, friendly, mobile‑responsive, non‑gimmicky.
15. **Testing** — unit + smoke E2E.
16. **Docs** — this set.

## Pricing
| Plan | Price | Quota |
| --- | --- | --- |
| Starter | $19/mo | 50 requests/mo |
| Pro | $49/mo | 250 requests/mo, AI replies, testimonials |
| Business | $99/mo | 1,000 requests/mo, alerts, reports |
| Agency | $199/mo | multi‑business placeholder |
| Setup service | $99 one‑time | done‑for‑you onboarding |

## Non‑goals (v1)
- Google Business Profile API integration.
- Automated SMS drip campaigns / complex scheduling.
- Auto‑posting replies, testimonials, or social posts.
- Image generation for social posts (text‑only is enough).
- Medical/legal claims for clinics.

## Acceptance criteria
MVP is complete when a user can: sign up/login → create an organization → add a
review link → add customers → create/send/copy a review request → manually add a
review → have (mock) AI analyze it and draft a reply → see negatives flagged →
generate testimonial/social drafts from positives → view reputation metrics on a
dashboard, with all data organization‑scoped, compliance docs present, README/docs
complete, and core tests passing.
