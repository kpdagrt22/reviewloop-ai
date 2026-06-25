"use server";

import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { getStripe } from "@/lib/billing/stripe";
import { getPlan, type PlanId } from "@/lib/billing/plans";
import { env } from "@/lib/env";

/**
 * Starts a Stripe Checkout session for the selected plan and redirects the user
 * to Stripe. If Stripe (or the plan's price id) isn't configured, redirects back
 * to billing with a notice — never throws a hard error in the UI.
 */
export async function startCheckoutAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const planId = String(formData.get("plan") ?? "") as PlanId;

  const stripe = await getStripe();
  if (!stripe) redirect("/app/billing?error=not_configured");

  const plan = getPlan(planId);
  const priceId = process.env[plan.stripePriceEnv];
  if (!priceId) redirect("/app/billing?error=missing_price");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.appUrl}/app/billing?success=1`,
    cancel_url: `${env.appUrl}/app/billing?canceled=1`,
    client_reference_id: org.id,
    metadata: { organization_id: org.id, plan: planId },
    // Stripe does not copy Session metadata onto the resulting Subscription;
    // set it explicitly so the org id travels with the subscription too.
    subscription_data: { metadata: { organization_id: org.id, plan: planId } },
  });

  if (session.url) redirect(session.url);
  redirect("/app/billing?error=session");
}
