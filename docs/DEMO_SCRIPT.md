# ReviewLoop AI — 5-Minute Demo Script

A tight, repeatable demo for showing ReviewLoop to a service-business owner.
Runs entirely on **mock AI** (no API keys). Total time: ~5 minutes.

## Before the demo (one-time)
1. App running with Supabase configured and migrations applied
   (`0001` → `0002` → `0003`). See `docs/SUPABASE_SETUP.md`.
2. Seed the demo org: `npm run seed`
   - Creates **Sunshine Plumbing (Demo)** with customers, reviews, a reply
     draft, a negative-review alert, a testimonial, and a social post.
   - Login: `demo@reviewloop.test` / `ReviewLoopDemo123!`
3. Keep `AI_PROVIDER=mock` so everything works instantly and deterministically.
4. Have the two sample reviews below ready to paste.

## The click-path (talk track in italics)

1. **Landing page** (`/`) — *"This helps you get more genuine reviews, reply
   faster, and turn happy customers into proof — without fake reviews or
   chasing people."* (30s)
2. **Log in** (`/login`) with the demo account → land on **Dashboard** (`/app`).
   *"Here's the owner's home base: requests sent, reviews captured, average
   rating, pending replies, and anything that needs attention."* (30s)
3. **Settings** (`/app/settings`) — point at the review links + brand tone.
   *"You paste your Google review link once. No Google API needed."* (20s)
4. **Customers** (`/app/customers`) — *"After each job you add the customer.
   You can also import a CSV"* — optionally import `samples/customers.csv`. Show
   the consent + opt-out columns. *"We only message people who agreed, and
   opt-out is enforced."* (40s)
5. **Review requests** (`/app/requests`) — pick a customer, show the **neutral**
   message preview, click **Copy message**. *"It asks for honest feedback — never
   'leave us 5 stars'. Send it however you like, then mark it sent."* (40s)
6. **Paste a positive review** (`/app/reviews/new`) — paste the 5-star sample
   below, rating 5, Save & analyze. On the detail page show: sentiment, the
   **editable AI reply draft** (Copy / Mark as posted), and the **testimonial +
   social post** drafts. *"AI drafts everything — you approve and post. Nothing
   is auto-posted."* (60s)
7. **Paste a negative review** — paste the 2-star sample, rating 2, Save. Show
   the **Needs attention** flag and the professional, no-fault reply draft.
   *"You catch unhappy customers early and respond well — offline, not a public
   fight."* (40s)
8. **Weekly report** (`/app/report`) — show metrics, rating distribution, and
   click **Generate AI summary**. *"A weekly snapshot you can act on."* (30s)
9. **Pricing** (`/app/billing` or `/pricing`) — *"Starter $19, Pro $49,
   Business $99. During beta I'll set it all up for you for $49/month."* (20s)

## Sample reviews to paste

**Positive (rating 5):**
> Great service. The technician arrived on time, explained the repair clearly,
> and fixed the issue quickly. Highly recommend.

**Negative (rating 2):**
> The appointment was delayed and I had to call twice for an update. The repair
> was fine, but communication could have been better.

## Reset between demos
Re-run `npm run seed` to wipe and recreate the demo org (the demo login is reused).

## What to emphasize
- No fake reviews, no review gating, **owner approves every reply** — nothing
  posts automatically.
- Works today with **manual** capture (no Google API dependency).
- The painful parts (writing replies, making social proof) are done for them.
