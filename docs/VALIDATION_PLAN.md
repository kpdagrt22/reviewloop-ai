# ReviewLoop AI — Validation Plan

The goal of the alpha is **validation, not feature completeness**: prove that
real service businesses will use the manual review loop and pay for it before
building heavier integrations (Google API, SMS automation, multi-location).

---

## Recommended first niche: **HVAC and plumbing (home services)**

Scored against five factors:

| Factor | Cleaning | Salons | **HVAC / Plumbing** | Auto detailing |
| --- | --- | --- | --- | --- |
| Easy to reach (directories, FB groups, local SEO) | ✅ | ✅ | ✅ | ✅ |
| Reviews drive revenue (high-ticket, trust-led) | ◐ | ◐ | ✅✅ | ◐ |
| Simple, repeatable job → review workflow | ✅ | ✅ | ✅ | ✅ |
| Willingness to pay (job value $200–$5,000) | ◐ | ◐ | ✅✅ | ◐ |
| Low compliance risk (no medical/legal claims) | ✅ | ✅ | ✅ | ✅ |

**Pick HVAC/plumbing first.** A single won job is worth hundreds to thousands of
dollars, owners already know reviews win them work, and the job→review cadence is
clean. Salons/cleaning are a strong **second** niche (higher volume, lower ticket)
once the loop is proven. Start with one vertical to keep outreach and copy sharp.

---

## 7-day validation plan
- **Day 1** — Finalize the one-line pitch + the $49/mo done-for-you beta offer.
  Build a list of 50 local HVAC/plumbing businesses (Google Maps + FB groups).
- **Day 2–3** — Send 30 cold outreach messages (email + FB DM). Aim for 3 demos.
- **Day 4** — Run demos using `docs/DEMO_SCRIPT.md` (seeded demo org, <5 min).
- **Day 5** — For interested owners, do the manual service: add their last
  10 customers, draft 3 review requests, draft replies to any reviews they share.
- **Day 6** — Ask the willingness-to-pay question (protocol below). Take a soft
  commit (setup deposit or card on file) from anyone who says yes.
- **Day 7** — Tally: contacted / replied / demoed / soft-yes / paid. Decide go/iterate.

## 30-day validation plan
- **Week 1** — 50 contacts, 3 demos, 1 paid beta (or 3 strong yes signals).
- **Week 2** — Onboard 3–5 beta businesses; run the loop weekly for each.
- **Week 3** — Measure activation + loop completion; collect 2 testimonials of
  ReviewLoop itself; refine the request copy and reply tone from real feedback.
- **Week 4** — Convert beta → paid. Decide whether to widen to a second niche
  (salons/cleaning) or go deeper on HVAC. Re-check the gates below.

---

## Outreach scripts
Keep them short, specific, and honest. Lead with the wedge (we do it for you).

**Cold email**
> Subject: more Google reviews for {{business}} (done for you)
>
> Hi {{name}} — I help local {{trade}} businesses get more reviews without
> chasing customers. For your last ~10 jobs I'll draft the review requests,
> write professional replies to any reviews you get, and turn your best ones
> into social posts. $49/month during beta, cancel anytime. Want a 5-minute look?

**Facebook / Instagram DM**
> Hey {{name}}! Love the work you do. I built a simple tool that helps
> {{trade}} businesses ask happy customers for reviews and reply faster (no fake
> reviews, you approve everything). Happy to set it up for you for free this week
> and show you — interested?

**LinkedIn**
> Hi {{name}}, I'm piloting ReviewLoop — a review-request + AI-reply assistant
> for {{trade}} businesses. It catches unhappy customers early and turns 5-star
> reviews into social proof. I'm onboarding 5 local businesses this month and
> would value your feedback. Open to a quick demo?

**Manual service-assisted offer (the wedge)**
> "I'll help you request reviews from your recent customers, draft professional
> replies, and turn your best reviews into social posts for $49/month while
> we're in beta."

---

## Willingness-to-pay protocol
Don't just ask "would you pay?" — structure it:
1. **Anchor** on value: "A single extra job from better reviews is worth
   $X — this is $19–$49/month."
2. **Quote one price per segment** (solo operator → Starter $19; growing shop →
   Pro $49). Don't offer the whole menu.
3. **Record the answer** as yes / maybe / no, plus the objection if any.
4. **Soft commit** to separate stated from revealed willingness: card on file
   for the free beta, or a small ($49) setup deposit credited to month one.
5. A "yes" only counts as validated when paired with a soft commit.

---

## Success metrics (go signal)
- 30+ businesses contacted, 5+ replies, 3+ demos booked.
- **1 paid beta user, or 3 strong "yes + soft commit" signals.**
- ≥ 3 of 5 onboarded businesses paste/track reviews weekly without prompting.
- Owners say the reply drafts save real time and they trust them enough to post.

## Kill metrics (stop / pivot signal)
- Fewer than 2 replies from 50 targeted contacts.
- Owners don't care about reply drafts (already handled / not a pain).
- Businesses already have a strong review workflow (e.g. an existing tool).
- Unwillingness to pay even $19–$49/month after seeing value.

## Gates — do NOT build until met
- **No Google Business Profile API** until 3 paying users explicitly ask.
- **No complex SMS automation** until the opt-in workflow is proven with consent.
- **No multi-location / agency** complexity until an agency is paying and hitting
  single-org limits.

---

## RLS / data-isolation validation
Create two accounts with two organizations. Confirm account B cannot see account
A's customers, reviews, or testimonials (direct URL access to an A-owned
`/app/reviews/[id]` must 404 for B). This exercises the policies in `DATABASE.md`.
