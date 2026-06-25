/**
 * Centralized environment feature detection. The app is designed to run with
 * only Supabase configured; every other integration degrades gracefully and is
 * reported as "not configured" rather than crashing.
 */

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  aiProvider: (process.env.AI_PROVIDER ?? "mock").toLowerCase(),
};

export function hasSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasSupabaseServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function hasTwilio(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_MESSAGING_SERVICE_SID,
  );
}

export function hasStripe(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function aiConfigured(): { provider: string; live: boolean } {
  const provider = env.aiProvider;
  if (provider === "openai") return { provider, live: Boolean(process.env.OPENAI_API_KEY) };
  if (provider === "anthropic")
    return { provider, live: Boolean(process.env.ANTHROPIC_API_KEY) };
  return { provider: "mock", live: true };
}
