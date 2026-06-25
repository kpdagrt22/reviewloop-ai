/**
 * Plan catalog. Single source of truth for pricing copy and request quotas,
 * shared by the public pricing page, billing page, and quota checks.
 */
export type PlanId = "starter" | "pro" | "business" | "agency";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  requestQuota: number;
  blurb: string;
  features: string[];
  /** Env var holding the Stripe Price ID for this plan, when billing is live. */
  stripePriceEnv: string;
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 19,
    requestQuota: 50,
    blurb: "For solo operators getting their first reviews flowing.",
    stripePriceEnv: "NEXT_PUBLIC_STRIPE_PRICE_STARTER",
    features: [
      "50 review requests / month",
      "Manual review capture",
      "AI reply drafts (mock or live)",
      "Google review link & request templates",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 49,
    requestQuota: 250,
    highlight: true,
    blurb: "For growing service businesses turning reviews into proof.",
    stripePriceEnv: "NEXT_PUBLIC_STRIPE_PRICE_PRO",
    features: [
      "250 review requests / month",
      "AI replies + testimonials",
      "Social post drafts",
      "Negative review flagging",
    ],
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    requestQuota: 1000,
    blurb: "For established shops that live and die by reputation.",
    stripePriceEnv: "NEXT_PUBLIC_STRIPE_PRICE_BUSINESS",
    features: [
      "1,000 review requests / month",
      "Negative review alerts & escalation email",
      "Weekly reputation reports",
      "Everything in Pro",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: 199,
    requestQuota: 5000,
    blurb: "For agencies managing reviews for many local businesses.",
    stripePriceEnv: "NEXT_PUBLIC_STRIPE_PRICE_AGENCY",
    features: [
      "Multi-business support (placeholder)",
      "5,000 review requests / month",
      "Priority support",
      "Everything in Business",
    ],
  },
];

export const SETUP_SERVICE = {
  name: "Done-for-you setup",
  priceOneTime: 99,
  blurb: "We onboard your business, import customers, and configure templates for you.",
};

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}
