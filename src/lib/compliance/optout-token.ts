import { createHmac, timingSafeEqual } from "node:crypto";
import { optOutSecret } from "@/lib/env";

/**
 * Stateless, signed opt-out tokens. A token encodes a customer id plus an HMAC
 * so a public (unauthenticated) opt-out page can verify the request without a
 * login and without a stored token column. Forging a token for an arbitrary
 * customer requires the signing secret, which never leaves the server.
 *
 * Token format: `${base64url(customerId)}.${base64url(hmacSha256(payload))}`.
 * When no signing secret is configured the feature is unavailable (create
 * returns "", verify returns null) — callers degrade gracefully.
 */

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function createOptOutToken(customerId: string, key = optOutSecret()): string {
  if (!key || !customerId) return "";
  const payload = b64url(customerId);
  const sig = b64url(createHmac("sha256", key).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyOptOutToken(token: string, key = optOutSecret()): string | null {
  if (!key || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = b64url(createHmac("sha256", key).update(payload).digest());

  const given = Buffer.from(sig);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;

  try {
    const id = Buffer.from(payload, "base64url").toString("utf8");
    return id || null;
  } catch {
    return null;
  }
}
