# Validation Plan

The goal of v1 is **validation, not feature completeness**. Prove that real
service businesses will use the manual loop and pay for it *before* building
heavier integrations.

## Before building advanced integrations
1. **Manually onboard 5 service businesses** (use the $99 setup service as the
   wedge — do it for them).
2. **Add their customers manually** (or via CSV import).
3. **Send or copy review‑request messages** for recently served customers.
4. **Ask them to paste reviews** they receive back into ReviewLoop.
5. **Generate reply drafts and testimonial/social posts**; have the owner post
   them.
6. **Test willingness to pay** $19–$49/month after they've seen value.

## Gates (do NOT build until met)
- **Do not build Google Business Profile API integration** until **3 paying
  users explicitly ask** for it. The manual paste loop must be proven first.
- **Do not build complex SMS automation** until the **opt‑in workflow is proven**
  with manual sends and you have consented contacts who reply.
- **Do not build multi‑business/agency tooling** until at least one agency is
  paying and hitting the single‑org limits.

## What "validated" looks like
- ≥ 3 of 5 businesses actively paste reviews weekly without prompting.
- ≥ 3 paying subscribers on Starter/Pro after a 2–4 week trial.
- Owners report the reply drafts save them real time and they trust them enough
  to post (with light edits).
- Negative‑review flagging catches at least one situation an owner would have
  otherwise missed.

## Metrics to watch (manual at first)
- Activation: % of onboarded businesses that add ≥ 1 customer and ≥ 1 review.
- Loop completion: reviews pasted → reply drafts → marked posted.
- Reuse: positive reviews → testimonials/social posts created.
- Retention: weekly active businesses; subscription survival to month 2.

## How to run a validation session (per business)
1. Sit with the owner; create their org and add their review link.
2. Import 10–20 recent customers.
3. Copy 2–3 review requests and have them send via their own phone/email.
4. Paste 2–3 real past reviews (mix of ratings).
5. Walk through the AI analysis, edit a reply, copy it, and mark posted.
6. Turn a 5‑star review into a testimonial + a social post.
7. Show the weekly report. Ask: "Would you pay $X/month for this?"

## RLS / data‑isolation validation
Create two separate accounts with two organizations. Confirm account B cannot
see account A's customers, reviews, or testimonials (direct URL access to an
A‑owned `/app/reviews/[id]` should 404/!found for B). This exercises the RLS
policies described in `DATABASE.md`.
