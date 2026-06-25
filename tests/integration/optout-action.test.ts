import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { createFakeSupabase, findWrite } from "./_supabase-mock";

/**
 * Coverage for the public opt-out action (compliance-critical). It runs WITHOUT
 * a session, using the service-role client, authorized only by a signed token.
 * We mock next/navigation.redirect to throw a tagged error so we can assert the
 * destination, and the admin client with the in-memory fake.
 */

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const createAdminClient = vi.fn();

vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClient() }));

import { confirmOptOutAction } from "@/app/optout/[token]/actions";
import { createOptOutToken } from "@/lib/compliance/optout-token";

process.env.OPTOUT_SECRET = "test-optout-secret-xyz";
afterAll(() => {
  delete process.env.OPTOUT_SECRET;
});

function form(token: string): FormData {
  const fd = new FormData();
  fd.set("token", token);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  redirect.mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
});

describe("confirmOptOutAction", () => {
  it("sets opt_out=true for exactly the token's customer and confirms", async () => {
    const token = createOptOutToken("cust-1");
    const fake = createFakeSupabase();
    createAdminClient.mockReturnValue(fake.client);

    await expect(confirmOptOutAction(form(token))).rejects.toThrow(`REDIRECT:/optout/${token}?done=1`);

    const w = findWrite(fake, "customers", "update");
    expect(w).toBeDefined();
    expect((w?.payload as Record<string, unknown>).opt_out).toBe(true);
    // Scoped to exactly the customer the token authorizes — nothing else.
    expect(w?.filters).toContainEqual(["id", "cust-1"]);
    expect(fake.writes.every((x) => x.table === "customers")).toBe(true);
  });

  it("rejects an invalid token without touching the database", async () => {
    await expect(confirmOptOutAction(form("not-a-valid-token"))).rejects.toThrow(
      "REDIRECT:/optout/invalid",
    );
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("degrades gracefully when the service role is not configured", async () => {
    const token = createOptOutToken("cust-2");
    createAdminClient.mockReturnValue(null);

    await expect(confirmOptOutAction(form(token))).rejects.toThrow(
      `REDIRECT:/optout/${token}?error=unavailable`,
    );
  });

  it("surfaces a DB failure as an error redirect (no silent success)", async () => {
    const token = createOptOutToken("cust-3");
    const fake = createFakeSupabase({ errors: { "customers:update": { message: "db down" } } });
    createAdminClient.mockReturnValue(fake.client);

    await expect(confirmOptOutAction(form(token))).rejects.toThrow(
      `REDIRECT:/optout/${token}?error=failed`,
    );
  });
});
