import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook handler. Verifies the signature, then upserts subscription
 * state via the service-role client (bypasses RLS). Returns 501 if Stripe is
 * not configured so the route is safe to deploy before billing is set up.
 */
export async function POST(req: Request) {
  const stripe = await getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 501 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 501 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as {
        client_reference_id?: string | null;
        customer?: string | null;
        subscription?: string | null;
        metadata?: { organization_id?: string; plan?: string } | null;
      };
      const orgId = session.metadata?.organization_id ?? session.client_reference_id;
      if (orgId) {
        await admin.from("subscriptions").upsert(
          {
            organization_id: orgId,
            stripe_customer_id: (session.customer as string) ?? null,
            stripe_subscription_id: (session.subscription as string) ?? null,
            plan: session.metadata?.plan ?? null,
            status: "active",
          },
          { onConflict: "organization_id" },
        );
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as {
        id: string;
        status: string;
        current_period_end: number;
      };
      // Look up by the Stripe subscription id (always present) rather than
      // relying on subscription metadata, which is not copied from the Checkout
      // Session. The row was created by checkout.session.completed above.
      await admin
        .from("subscriptions")
        .update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
