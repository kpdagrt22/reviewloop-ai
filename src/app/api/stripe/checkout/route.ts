import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { getActiveOrg } from "@/lib/auth/session";
import { getPlan, type PlanId } from "@/lib/billing/plans";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * JSON checkout endpoint (alternative to the billing server action). POST
 * { plan } and receive { url } to redirect to. Returns 501 when billing isn't
 * configured. The billing page uses the server action; this exists for external
 * or programmatic callers.
 */
export async function POST(req: Request) {
  const stripe = await getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 501 });
  }

  const org = await getActiveOrg();
  if (!org) return NextResponse.json({ error: "No organization" }, { status: 401 });

  let planId: PlanId;
  try {
    const body = (await req.json()) as { plan?: PlanId };
    planId = body.plan ?? "pro";
  } catch {
    planId = "pro";
  }

  const plan = getPlan(planId);
  const priceId = process.env[plan.stripePriceEnv];
  if (!priceId) {
    return NextResponse.json({ error: "Plan price not configured" }, { status: 501 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.appUrl}/app/billing?success=1`,
    cancel_url: `${env.appUrl}/app/billing?canceled=1`,
    client_reference_id: org.id,
    metadata: { organization_id: org.id, plan: planId },
  });

  return NextResponse.json({ url: session.url });
}
