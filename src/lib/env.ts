/**
 * Centralized environment access + feature detection.
 *
 * Design rules:
 *  - The app runs with ONLY the two public Supabase vars + (ideally) the service
 *    role. Every other integration degrades gracefully ("not configured").
 *  - Server-only secrets are never read in client components. Only values under
 *    `publicEnv` (all NEXT_PUBLIC_*) are safe to reference from the browser.
 *  - Helpers below return booleans/labels, never secret values, so they are safe
 *    to surface in the admin/debug page and the verify:env script.
 */

/** Public, client-safe env (all NEXT_PUBLIC_*). */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
};

/** Back-compat alias kept for existing imports. */
export const env = {
  appUrl: publicEnv.appUrl,
  aiProvider: (process.env.AI_PROVIDER ?? "mock").toLowerCase(),
};

export type AIProviderName = "mock" | "openai" | "anthropic";

export function aiProvider(): AIProviderName {
  const p = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  return p === "openai" || p === "anthropic" ? p : "mock";
}

// ---- Feature detection (booleans only) ------------------------------------

export function hasSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasSupabaseServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Resolved "from" email (supports FROM_EMAIL or legacy RESEND_FROM_EMAIL). */
export function fromEmail(): string {
  return process.env.FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "";
}

export function hasResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY && fromEmail());
}

export function hasTwilio(): boolean {
  // A messaging service SID OR a from phone number is enough to send.
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_PHONE_NUMBER),
  );
}

export function hasStripe(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function aiConfigured(): { provider: string; live: boolean } {
  const provider = aiProvider();
  if (provider === "openai") return { provider, live: Boolean(process.env.OPENAI_API_KEY) };
  if (provider === "anthropic")
    return { provider, live: Boolean(process.env.ANTHROPIC_API_KEY) };
  return { provider: "mock", live: true };
}

// ---- Admin allowlist ------------------------------------------------------

/** Parsed ADMIN_EMAILS (comma/space separated, lowercased). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Is this email a configured super-admin? When ADMIN_EMAILS is unset the
 * allowlist is empty and this returns false — callers should then fall back to
 * a safe default (e.g. org owner only) rather than opening access.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

// ---- Status map (non-secret) for verify:env + admin page ------------------

export interface EnvVarStatus {
  name: string;
  group: string;
  required: "always" | "for-real-supabase" | "for-billing" | "optional";
  present: boolean;
}

/**
 * Returns presence (NOT values) of every known env var, grouped. Safe to print
 * and to render in the admin page. Never returns secret contents.
 */
export function getEnvStatus(): EnvVarStatus[] {
  const p = (name: string) => Boolean(process.env[name]);
  return [
    { name: "NEXT_PUBLIC_SUPABASE_URL", group: "Supabase", required: "for-real-supabase", present: p("NEXT_PUBLIC_SUPABASE_URL") },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", group: "Supabase", required: "for-real-supabase", present: p("NEXT_PUBLIC_SUPABASE_ANON_KEY") },
    { name: "SUPABASE_SERVICE_ROLE_KEY", group: "Supabase", required: "for-billing", present: p("SUPABASE_SERVICE_ROLE_KEY") },
    { name: "AI_PROVIDER", group: "AI", required: "optional", present: p("AI_PROVIDER") },
    { name: "OPENAI_API_KEY", group: "AI", required: "optional", present: p("OPENAI_API_KEY") },
    { name: "ANTHROPIC_API_KEY", group: "AI", required: "optional", present: p("ANTHROPIC_API_KEY") },
    { name: "RESEND_API_KEY", group: "Email", required: "optional", present: p("RESEND_API_KEY") },
    { name: "FROM_EMAIL", group: "Email", required: "optional", present: Boolean(fromEmail()) },
    { name: "TWILIO_ACCOUNT_SID", group: "SMS", required: "optional", present: p("TWILIO_ACCOUNT_SID") },
    { name: "TWILIO_AUTH_TOKEN", group: "SMS", required: "optional", present: p("TWILIO_AUTH_TOKEN") },
    { name: "TWILIO_MESSAGING_SERVICE_SID", group: "SMS", required: "optional", present: p("TWILIO_MESSAGING_SERVICE_SID") },
    { name: "TWILIO_PHONE_NUMBER", group: "SMS", required: "optional", present: p("TWILIO_PHONE_NUMBER") },
    { name: "STRIPE_SECRET_KEY", group: "Billing", required: "for-billing", present: p("STRIPE_SECRET_KEY") },
    { name: "STRIPE_WEBHOOK_SECRET", group: "Billing", required: "for-billing", present: p("STRIPE_WEBHOOK_SECRET") },
    { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", group: "Billing", required: "optional", present: p("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") },
    { name: "NEXT_PUBLIC_STRIPE_PRICE_STARTER", group: "Billing", required: "optional", present: p("NEXT_PUBLIC_STRIPE_PRICE_STARTER") },
    { name: "NEXT_PUBLIC_STRIPE_PRICE_PRO", group: "Billing", required: "optional", present: p("NEXT_PUBLIC_STRIPE_PRICE_PRO") },
    { name: "NEXT_PUBLIC_STRIPE_PRICE_BUSINESS", group: "Billing", required: "optional", present: p("NEXT_PUBLIC_STRIPE_PRICE_BUSINESS") },
    { name: "NEXT_PUBLIC_STRIPE_PRICE_AGENCY", group: "Billing", required: "optional", present: p("NEXT_PUBLIC_STRIPE_PRICE_AGENCY") },
    { name: "NEXT_PUBLIC_APP_URL", group: "App", required: "optional", present: p("NEXT_PUBLIC_APP_URL") },
    { name: "ADMIN_EMAILS", group: "App", required: "optional", present: p("ADMIN_EMAILS") },
  ];
}
