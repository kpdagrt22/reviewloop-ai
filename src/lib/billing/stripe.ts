import { hasStripe } from "@/lib/env";

/**
 * Stripe abstraction. The `stripe` package is an optional dependency loaded
 * dynamically. When STRIPE_SECRET_KEY is absent, getStripe() returns null and
 * the UI shows "Billing not configured" instead of breaking.
 */
export async function getStripe() {
  if (!hasStripe()) return null;
  const StripeModule = await import("stripe");
  const Stripe = StripeModule.default;
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // Pin a recent API version; safe to omit to use account default.
    apiVersion: "2024-12-18.acacia" as never,
  });
}

export function billingConfigured(): boolean {
  return hasStripe();
}
