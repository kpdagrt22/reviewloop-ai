# First Paid Pilot SOP

Standard operating procedure for onboarding ReviewLoop AI's first paid beta
customer. Follow this end-to-end, checking boxes as you go. ReviewLoop AI v1 is
**manual and link-based** (no Google Business Profile API), **owner-approved**
(nothing auto-posts), and **compliance-aware**. Keep the guardrails in
[Section 8](#8-red-flags--stop-and-decline) in mind at every step.

> **Compliance reminder (read first):** We do **not** create fake reviews, do
> **not** gate or filter reviews by predicted rating, do **not** auto-post to
> social, and do **not** send unsolicited messaging. Review requests go out
> manually or via approved email only, and only to customers who have consented
> to being contacted. STOP/opt-out handling is advisory copy; opt-outs are
> recorded manually. Never promise "guaranteed 5-star reviews" or "automatic
> Google review posting."

---

## 1. Before the call

Goal: have a working, seeded-looking demo org so the prospect sees real screens,
not slideware.

- [ ] **Create your account** at `/signup`, then sign in at `/login`.
- [ ] **Create the org** by completing `/onboarding` (business name, basics).
- [ ] **Add business review links** in `/app/settings` (Google review link,
      review platform links, tone, escalation email). These power the
      review-request copy and the report.
- [ ] **Prepare a review request template** in `/app/requests` (compose the
      message you'll copy/send; stage it as `ready`).
- [ ] **Prepare sample customers** in `/app/customers` (add a few by hand, or use
      CSV import) so the request and reviews flows have data.
- [ ] **Test mock AI**: with `AI_PROVIDER=mock` (the default, no key needed),
      open a review in `/app/reviews/[id]` and confirm AI analysis + reply draft
      render. This proves the demo works with zero external keys.

> Tip: only the two `NEXT_PUBLIC_SUPABASE_*` env vars are strictly required to
> run. `AI_PROVIDER` defaults to `mock`, so you can demo without any AI key.

---

## 2. During the demo

Keep it to the prospect's real workflow. Drive these screens live.

- [ ] **Ask their current workflow**: how do they ask for reviews today, who
      replies, and how long it takes?
- [ ] **Show a review request** in `/app/requests` (compose -> copy/send ->
      `ready` staging). Emphasize: they copy and send via their own channel or
      approved email — nothing is blasted automatically.
- [ ] **Show a reply draft** in `/app/reviews/[id]` (AI analysis + suggested
      reply). Emphasize the owner edits and approves before anything is posted.
- [ ] **Show the negative-review alert** flow (a low rating surfaces for fast,
      human follow-up — not suppression).
- [ ] **Show testimonial + social post** reuse: `/app/testimonials` library and
      `/app/social` (copy-only; the owner posts manually).
- [ ] **Show the weekly report** at `/app/report` (reputation snapshot they can
      act on).
- [ ] **Ask the pricing question**: "If this saved you X hours and got you more
      reviews, is $19–$99/mo worth it?" (see pricing table below).

### Pricing (for reference during the call)

| Plan     | Price      | Review requests / mo | Notes                    |
|----------|------------|----------------------|--------------------------|
| Starter  | $19/mo     | 50                   |                          |
| Pro      | $49/mo     | 250                  |                          |
| Business | $99/mo     | 1,000                |                          |
| Agency   | $199/mo    | —                    | Placeholder, multi-business |
| Setup    | $99 one-time | —                  | One-time onboarding fee  |

### Sample reviews for the demo

- **Positive (rating 5):** "Great service. The technician arrived on time,
  explained the repair clearly, and fixed the issue quickly. Highly recommend."
- **Negative (rating 2):** "The appointment was delayed and I had to call twice
  for an update. The repair was fine, but communication could have been better."

---

## 3. If they say yes

Set them up for real value in the first session.

- [ ] **Collect business info** (legal/display name, address, phone, hours).
- [ ] **Collect their Google review link** (and any other review platform links).
- [ ] **Collect up to 10 recent customer names/emails — only if consent exists.**
      If the customer did not consent to being contacted, do **not** import them.
- [ ] **Configure the org** in `/app/settings` (review links, tone, escalation
      email).
- [ ] **Create message templates** in `/app/requests` for their voice.
- [ ] **Process 3 existing reviews manually** via `/app/reviews/new` (capture
      real reviews they already have).
- [ ] **Generate reply drafts** for those 3 in `/app/reviews/[id]`, so they see
      immediate output to approve and use.
- [ ] **Schedule the follow-up** (the 7-day check-in below).

> Consent is non-negotiable. No consent = no import and no messaging. There is no
> public customer-facing redirect route in v1; the `clicked` status is set
> manually.

---

## 4. Payment options

ReviewLoop AI billing is **not finalized for live charges** in the pilot.

- [ ] **Treat Stripe as a test placeholder.** Do **not** collect real payment via
      Stripe checkout unless billing has been fully configured
      (`SUPABASE_SERVICE_ROLE_KEY` + `STRIPE_*` set and verified).
- [ ] **Use a manual invoice or payment link** (e.g. an external invoice) until
      billing is finalized.
- [ ] **Record the plan manually** (which plan, price, start date) in your own
      tracking.
- [ ] **Do not hand-edit subscription records.** The `subscriptions` table is
      member-read-only; rows are written **only** by the service-role Stripe
      webhook (`/api/stripe/webhook`). Forcing writes by hand will break the
      billing model.

---

## 5. First 7 days

Drive real usage. This is where the pilot earns its fee.

- [ ] **Send review requests manually or via approved email only** — never
      automated/unsolicited blasts, and only to consented customers.
- [ ] **Capture reviews** as they come in via `/app/reviews/new`.
- [ ] **Draft replies** in `/app/reviews/[id]` for owner approval (no auto-post).
- [ ] **Collect feedback** from the owner on tone, time saved, and friction.
- [ ] **Track usage** in `/app/billing` (requests used vs. plan limit).

---

## 6. Success review

Run this at the end of the pilot window.

- [ ] **Did they save time** vs. their old workflow?
- [ ] **Did they request more reviews** than before?
- [ ] **Did they reply faster** to incoming reviews?
- [ ] **Did they reuse testimonials** (and/or social content)?
- [ ] **Will they continue paying?** Confirm the plan and move from manual
      invoice to a finalized billing path when ready.

---

## 7. Churn prevention

Keep the value visible week over week.

- [ ] **Send the weekly report** from `/app/report` so they see momentum.
- [ ] **Owner reminder**: nudge them to approve pending reply drafts and requests.
- [ ] **Negative review alert**: surface low ratings fast for human follow-up
      (resolve, don't hide).
- [ ] **Testimonial + social content**: feed them ready-to-use, owner-approved
      copy from `/app/testimonials` and `/app/social`.

---

## 8. Red flags — STOP and decline

If a prospect asks for any of the following, **stop the pilot and decline**.
These violate ReviewLoop AI's scope and compliance posture:

- [ ] Asks for **fake reviews**. (We never create them.)
- [ ] Asks to **hide or suppress negative reviews** / gate reviews by rating.
- [ ] Asks to **spam customers** (bulk unsolicited messaging).
- [ ] **Has no consent** for messaging the customers they want to import.
- [ ] **Refuses to pay** after clear, demonstrated value.

> If you see a red flag, do not try to "work around" it. Decline politely and
> walk away. The product's value depends on staying compliant and trustworthy.

---

## Appendix: scope boundaries (set expectations)

These are **not built** and are out of scope for v1 — present them as boundaries,
not roadmap promises:

- No fake reviews; no review gating.
- No social auto-posting (copy-only).
- No Google Business Profile API (manual/link-based).
- No SMS automation; no inbound-SMS STOP automation (STOP is advisory copy;
  opt-out is set manually).
- No full CRM, no native app, no appointment scheduling, no customer portal.
- Agency multi-client is a placeholder.

**Never claim** "guaranteed 5-star reviews" or "automatic Google review posting."
