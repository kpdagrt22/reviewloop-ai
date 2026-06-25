import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminEmails,
  isAdminEmail,
  aiProvider,
  fromEmail,
  hasResend,
  hasStripe,
  getEnvStatus,
} from "@/lib/env";

// Snapshot + restore the env vars these tests mutate.
const KEYS = [
  "ADMIN_EMAILS",
  "AI_PROVIDER",
  "FROM_EMAIL",
  "RESEND_FROM_EMAIL",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
];
let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("admin allowlist", () => {
  it("parses a comma/space separated list, lowercased", () => {
    process.env.ADMIN_EMAILS = "Owner@Biz.com, admin@biz.com  founder@biz.com";
    expect(adminEmails()).toEqual(["owner@biz.com", "admin@biz.com", "founder@biz.com"]);
  });

  it("isAdminEmail is case-insensitive and false when unset", () => {
    expect(isAdminEmail("a@b.com")).toBe(false); // ADMIN_EMAILS unset
    process.env.ADMIN_EMAILS = "a@b.com";
    expect(isAdminEmail("A@B.com")).toBe(true);
    expect(isAdminEmail("other@b.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});

describe("aiProvider", () => {
  it("defaults to mock and validates the value", () => {
    expect(aiProvider()).toBe("mock");
    process.env.AI_PROVIDER = "openai";
    expect(aiProvider()).toBe("openai");
    process.env.AI_PROVIDER = "nonsense";
    expect(aiProvider()).toBe("mock");
  });
});

describe("fromEmail + integration detection", () => {
  it("prefers FROM_EMAIL but accepts legacy RESEND_FROM_EMAIL", () => {
    expect(fromEmail()).toBe("");
    process.env.RESEND_FROM_EMAIL = "legacy@biz.com";
    expect(fromEmail()).toBe("legacy@biz.com");
    process.env.FROM_EMAIL = "new@biz.com";
    expect(fromEmail()).toBe("new@biz.com");
  });

  it("hasResend requires both an api key and a from address", () => {
    expect(hasResend()).toBe(false);
    process.env.RESEND_API_KEY = "re_123";
    expect(hasResend()).toBe(false);
    process.env.FROM_EMAIL = "x@biz.com";
    expect(hasResend()).toBe(true);
  });

  it("hasStripe is false without a secret key (billing stays safe)", () => {
    expect(hasStripe()).toBe(false);
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    expect(hasStripe()).toBe(true);
  });
});

describe("getEnvStatus", () => {
  it("reports presence (never values) for known vars", () => {
    const status = getEnvStatus();
    const names = status.map((s) => s.name);
    expect(names).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(names).toContain("ADMIN_EMAILS");
    // It is a presence map: booleans only, no secret values leak.
    for (const s of status) expect(typeof s.present).toBe("boolean");
  });
});
