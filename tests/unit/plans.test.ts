import { describe, it, expect } from "vitest";
import { PLANS, getPlan } from "@/lib/billing/plans";

describe("billing plans catalog", () => {
  it("has the four expected plans with ascending price + quota", () => {
    const ids = PLANS.map((p) => p.id);
    expect(ids).toEqual(["starter", "pro", "business", "agency"]);
    const prices = PLANS.map((p) => p.priceMonthly);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(getPlan("starter").priceMonthly).toBe(19);
    expect(getPlan("pro").priceMonthly).toBe(49);
    expect(getPlan("business").priceMonthly).toBe(99);
    expect(getPlan("agency").priceMonthly).toBe(199);
  });

  it("maps each plan to a NEXT_PUBLIC stripe price env name", () => {
    for (const p of PLANS) {
      expect(p.stripePriceEnv).toMatch(/^NEXT_PUBLIC_STRIPE_PRICE_/);
    }
  });

  it("exposes a monthly request quota per plan", () => {
    expect(getPlan("starter").requestQuota).toBe(50);
    expect(getPlan("pro").requestQuota).toBe(250);
    expect(getPlan("business").requestQuota).toBe(1000);
  });

  it("throws on an unknown plan id", () => {
    // @ts-expect-error — intentionally invalid id
    expect(() => getPlan("enterprise")).toThrow();
  });
});
