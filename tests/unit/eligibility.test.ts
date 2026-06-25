import { describe, it, expect } from "vitest";
import { canMessage, eligibleCustomers } from "@/lib/messaging/eligibility";

describe("canMessage — opt-out rule", () => {
  it("blocks any channel when the customer opted out", () => {
    const c = {
      email: "x@y.com",
      phone: "+1555",
      consent_email: true,
      consent_sms: true,
      opt_out: true,
    };
    expect(canMessage(c, "email").eligible).toBe(false);
    expect(canMessage(c, "sms").eligible).toBe(false);
  });
});

describe("canMessage — email", () => {
  it("requires an email address", () => {
    expect(canMessage({ consent_email: true }, "email").eligible).toBe(false);
  });
  it("requires email consent", () => {
    expect(
      canMessage({ email: "x@y.com", consent_email: false }, "email").eligible,
    ).toBe(false);
  });
  it("allows when email + consent present and not opted out", () => {
    expect(
      canMessage({ email: "x@y.com", consent_email: true, opt_out: false }, "email").eligible,
    ).toBe(true);
  });
});

describe("canMessage — sms", () => {
  it("requires a phone and consent", () => {
    expect(canMessage({ consent_sms: true }, "sms").eligible).toBe(false);
    expect(canMessage({ phone: "+1555", consent_sms: false }, "sms").eligible).toBe(false);
    expect(canMessage({ phone: "+1555", consent_sms: true }, "sms").eligible).toBe(true);
  });
});

describe("eligibleCustomers", () => {
  it("filters a list to only messageable customers", () => {
    const customers = [
      { email: "a@a.com", consent_email: true, opt_out: false },
      { email: "b@b.com", consent_email: false, opt_out: false },
      { email: "c@c.com", consent_email: true, opt_out: true },
    ];
    expect(eligibleCustomers(customers, "email")).toHaveLength(1);
  });
});
