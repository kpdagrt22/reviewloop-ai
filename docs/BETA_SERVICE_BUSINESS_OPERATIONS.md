# Beta Service-Business Operations Kit

> A field guide for validating ReviewLoop AI with the first 5-10 real businesses. This is an
> operator playbook: who to target, how to reach them, what to say, how to demo, and how to
> decide whether the beta is working.

ReviewLoop AI is a manual, link-based, owner-approved review workflow (v1 has **no Google
Business Profile API** and **nothing auto-posts**). Everything below is written to match that
reality. We never promise fake reviews, review gating, or automatic Google posting.

---

## What We Sell (and What We Don't)

ReviewLoop AI helps a local service business:

- Send review requests (compose, copy, send by email/SMS link) and stage them as `ready`.
- Capture reviews manually and run AI analysis (sentiment, summary, suggested reply draft).
- Get an **owner-approved** reply draft for every review (nothing posts automatically).
- Turn good reviews into testimonials and copy-only social posts.
- See a weekly reputation report.

**Hard boundaries — state these plainly to every prospect.** These are scope limits, not
features:

- No fake reviews.
- No review gating (we do not filter out unhappy customers before they review).
- No social auto-posting (social copy is generated; the owner pastes it).
- No Google Business Profile API integration in v1.
- No SMS automation and no inbound-SMS STOP automation (STOP is advisory copy; opt-out is set
  manually).
- No full CRM, no native app, no appointment scheduling, no customer portal.
- Agency multi-client support is a placeholder.

Never say "guaranteed 5-star reviews" or "automatic Google review posting."

---

## Recommended First Niche

**Primary: HVAC and plumbing.**
**Secondary: cleaning companies and salons.**

Why these niches first:

- Reviews matter heavily to their buying decisions — customers vet them on Google before calling.
- Owners already understand Google reviews and check their rating.
- Service quality genuinely varies, so reviews are meaningful and replies matter.
- A negative review is painful and visible — they feel the problem we solve.
- AI reply drafts save real time for owners who are in the field all day.
- Testimonial and social-proof reuse is easy and obviously valuable.
- Lower compliance risk than medical or legal verticals.

Avoid medical and legal as first beta targets — higher compliance and review-handling risk.

---

## Good Beta Prospect Checklist

Use this to qualify a single business before reaching out.

- [ ] Local service business (HVAC, plumbing, cleaning, salon).
- [ ] Has roughly **10-300 Google reviews** (enough to matter, small enough to be owner-managed).
- [ ] Review replies are inconsistent or absent.
- [ ] Has a recent negative or neutral review.
- [ ] Owner or manager handles reputation manually today.
- [ ] Has a public website, phone, and email.
- [ ] Decision is owner-led (you can reach the person who says yes).
- [ ] Not a franchise or enterprise.

## Bad Beta Prospect List

Skip or deprioritize if any of these are true:

- Large franchise or enterprise (decisions are centralized/slow).
- No public reviews (nothing to work with).
- No online presence (no website/phone/email).
- Medical- or legal-heavy (compliance risk).
- Already uses a strong reputation agency or platform.
- Only wants fake reviews.
- Wants review gating.

---

## Prospecting Methods

### Google Maps searches

Search by niche + city + "reviews" and skim for businesses that fit the good-prospect checklist.

| Example search |
| --- |
| `HVAC repair Dallas reviews` |
| `plumber Austin reviews` |
| `cleaning company Denver reviews` |
| `salon Phoenix reviews` |
| `AC repair Tampa reviews` |
| `pest control Orlando reviews` |

For each result, open the Google listing and run the manual qualification checklist below.

### Manual qualification checklist

- [ ] Has reviews?
- [ ] Replies to reviews?
- [ ] Replies are generic (copy-paste / low effort)?
- [ ] Negative reviews left unanswered?
- [ ] Posts testimonials or social proof anywhere?
- [ ] Owner reachable (named contact, direct email/phone)?

A strong prospect typically has reviews, replies inconsistently or generically, has at least one
unanswered negative review, and an owner you can actually reach.

---

## Outreach Scripts

Keep everything honest. Lead with the real benefit (saving time and never missing a review), and
proactively rule out fake reviews and gating.

### Cold email

**Subject:** Quick idea for your Google reviews

> Hi [First Name],
>
> I came across [Business Name] and noticed you've got some solid Google reviews — but a few
> recent ones don't have replies yet.
>
> I'm building a simple tool that helps local service businesses request reviews and draft
> professional replies (including for the tough ones) so nothing slips through. To be clear: no
> fake reviews and no filtering out unhappy customers — just helping you respond well and reuse
> your best reviews.
>
> I'm looking for 3-5 beta businesses I'd set up manually, by hand. Would you be open to a quick
> 10-minute demo this week?
>
> Thanks,
> [Your Name]

### Facebook / Instagram DM

> Hi [First Name] — really like what [Business Name] is doing. I'm working with a few local
> service businesses on staying on top of Google reviews: requesting them and drafting solid
> replies (especially the hard ones). Not fake reviews, not hiding bad ones — just responding
> well and reusing the good ones. I'm looking for a couple of beta businesses I'd set up for you
> personally. Open to a quick 10-min look?

### Phone script

> Hi, is this [Owner Name]? My name's [Your Name]. I'll be quick — I'm working with a few local
> [HVAC/plumbing/cleaning/salon] businesses on their Google reviews.
>
> To be upfront, I'm **not** selling fake reviews and I'm **not** doing review gating — I think
> both are a bad idea. What I do is help you request reviews from happy customers and draft
> professional replies, including for negative ones, so you're not staring at a blank reply box.
>
> I'm looking for a handful of beta businesses I'd set up by hand. Could I show you a 10-minute
> demo this week?

---

## Beta Offer Options

| Option | Offer | Notes |
| --- | --- | --- |
| **A (recommended)** | $49/mo during beta, manual onboarding | Charge early; filters for real intent |
| B | $99 setup + first month included | More cash upfront, more friction |
| C | 7-day free pilot, then $49/mo | Lowest friction, weakest signal |

**Recommendation: charge early — Option A ($49/mo with manual onboarding).** A business willing
to pay $49/mo is a real signal that the problem is worth solving. Free pilots tend to attract
people who never convert.

For context, standard pricing after beta:

| Plan | Price | Review requests / mo |
| --- | --- | --- |
| Starter | $19/mo | 50 |
| Pro | $49/mo | 250 |
| Business | $99/mo | 1,000 |
| Agency | $199/mo | Placeholder (multi-business) |
| One-time setup | $99 | — |

---

## Demo Script

A tight 10-15 minute walkthrough using the seeded demo org ("Sunshine Plumbing (Demo)"). All
routes below are the real app routes.

1. **Show the dashboard** — open `/app`. Quick overview of reputation at a glance.
2. **Add a customer** — `/app/customers` (add or CSV import).
3. **Create a review request** — `/app/requests` (compose, copy, send; staged as `ready`).
4. **Show the ethical request copy** — point out the request wording: no gating, no pressure,
   STOP is advisory copy. This is a selling point, not a limitation.
5. **Paste a positive review** — `/app/reviews/new`, capture the rating-5 sample:
   *"Great service. The technician arrived on time, explained the repair clearly, and fixed the
   issue quickly. Highly recommend."*
6. **Show the AI reply** — open the review at `/app/reviews/[id]`; show the AI analysis and the
   suggested reply draft (owner approves; nothing posts automatically).
7. **Show testimonial / social** — from the review detail, generate a testimonial and a copy-only
   social post; show the libraries at `/app/testimonials` and `/app/social`.
8. **Paste a negative review** — `/app/reviews/new`, capture the rating-2 sample:
   *"The appointment was delayed and I had to call twice for an update. The repair was fine, but
   communication could have been better."*
9. **Show the alert + professional reply** — open `/app/reviews/[id]`; show the negative-review
   alert and the calm, professional reply draft.
10. **Show the weekly report** — `/app/report` (weekly reputation report).
11. **Explain pricing** — land on the beta offer ($49/mo, manual onboarding); standard plans
    start at $19/mo Starter.

---

## Questions to Ask Each Prospect

- How do you request reviews from customers today?
- Who replies to your reviews?
- Do negative reviews ever get missed?
- How long does replying take you?
- Do you reuse your good reviews anywhere (website, social)?
- Would a weekly reputation report be helpful?
- Would you pay $49/mo for this?
- What would make this useless to you?
- What would make it a no-brainer?
- Would you let us set it up for you?

---

## Success Metrics

### 7-day

- [ ] 30 businesses contacted
- [ ] 5 replies
- [ ] 3 demos
- [ ] 1 paid **OR** 3 strong yes

### 30-day

- [ ] 100 businesses contacted
- [ ] 15 replies
- [ ] 8 demos
- [ ] 3 paid
- [ ] 1 retained 14+ days
- [ ] 20+ real reviews processed

---

## Kill Metrics

Stop or pivot the niche/offer if you see these:

- Fewer than 2 replies from 50 contacts.
- Prospects don't care about replying to reviews.
- The only thing people want is fake reviews.
- They won't pay $19-49/mo.
- Manual onboarding is consistently too heavy to deliver.
- Agencies already solve this well for the segment you're targeting.

---

## Beta Feedback Form

Collect after the first real week of use.

- [ ] Business name
- [ ] Industry
- [ ] City / state
- [ ] Google review count
- [ ] Current review workflow
- [ ] Who replies to reviews today
- [ ] Demo usefulness (1-10)
- [ ] Would you pay for this?
- [ ] Comfortable monthly price
- [ ] Biggest objection
- [ ] Missing feature you'd want
- [ ] Would you use the testimonial / social drafts?
- [ ] Can we use your feedback anonymized?

---

## Appendix: Reference Card

**Demo login:** `demo@reviewloop.test` / `ReviewLoopDemo123!` (seeded demo org "Sunshine
Plumbing (Demo)" — 8 customers, 5 reviews, reply drafts, a negative-review alert, an approved
testimonial, and a social post).

**Key routes for demos:** `/app` (dashboard), `/app/customers`, `/app/requests`, `/app/reviews`,
`/app/reviews/new`, `/app/reviews/[id]`, `/app/testimonials`, `/app/social`, `/app/report`,
`/app/billing`, `/app/settings`.

**Reminder:** `clicked` is a manual status — there is no public customer-facing redirect route in
v1. Keep the pitch honest: manual, owner-approved, compliance-aware.
