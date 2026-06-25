import { describe, it, expect } from "vitest";
import { createOptOutToken, verifyOptOutToken } from "@/lib/compliance/optout-token";

const KEY = "test-signing-key-abcdef0123456789";

describe("opt-out tokens", () => {
  it("round-trips a customer id", () => {
    const token = createOptOutToken("11111111-1111-1111-1111-111111111111", KEY);
    expect(token).not.toBe("");
    expect(verifyOptOutToken(token, KEY)).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("rejects a tampered signature", () => {
    const token = createOptOutToken("cust-123", KEY);
    const [payload] = token.split(".");
    expect(verifyOptOutToken(`${payload}.AAAABBBBCCCC`, KEY)).toBeNull();
    expect(verifyOptOutToken(`${token}x`, KEY)).toBeNull();
  });

  it("rejects a token signed with a different key (no forgery across orgs)", () => {
    const token = createOptOutToken("cust-123", KEY);
    expect(verifyOptOutToken(token, "a-different-key")).toBeNull();
  });

  it("disables the feature gracefully when no secret is configured", () => {
    expect(createOptOutToken("cust-123", "")).toBe("");
    expect(verifyOptOutToken("anything", "")).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyOptOutToken("not-a-token", KEY)).toBeNull();
    expect(verifyOptOutToken("", KEY)).toBeNull();
    expect(verifyOptOutToken("a.b.c", KEY)).toBeNull();
  });
});
