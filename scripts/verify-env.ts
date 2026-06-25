/**
 * verify:env — checks environment configuration WITHOUT printing secret values.
 *
 * Usage:  npm run verify:env
 *
 * - Loads .env.local then .env (does not override already-set process.env).
 * - Reports each var as configured / missing, grouped.
 * - Fails (exit 1) only when a var REQUIRED for the selected mode is missing.
 * - Optional integrations only produce warnings.
 *
 * Self-contained on purpose (no app imports) so it runs in CI and locally
 * regardless of bundler/path-alias setup.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** Minimal .env parser. Does not override existing process.env values. */
function loadEnvFile(file: string): void {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const has = (name: string) => Boolean(process.env[name] && process.env[name]!.length > 0);
const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
const fromEmail = process.env.FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "";

type Mode = "required" | "optional";
interface Check {
  group: string;
  name: string;
  mode: Mode;
  present: boolean;
  note?: string;
}

const checks: Check[] = [
  { group: "Supabase", name: "NEXT_PUBLIC_SUPABASE_URL", mode: "required", present: has("NEXT_PUBLIC_SUPABASE_URL") },
  { group: "Supabase", name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", mode: "required", present: has("NEXT_PUBLIC_SUPABASE_ANON_KEY") },
  { group: "Supabase", name: "SUPABASE_SERVICE_ROLE_KEY", mode: "optional", present: has("SUPABASE_SERVICE_ROLE_KEY"), note: "required for Stripe billing webhook" },

  { group: "AI", name: "AI_PROVIDER", mode: "optional", present: has("AI_PROVIDER"), note: `mode=${provider}` },
  { group: "AI", name: "OPENAI_API_KEY", mode: provider === "openai" ? "required" : "optional", present: has("OPENAI_API_KEY") },
  { group: "AI", name: "ANTHROPIC_API_KEY", mode: provider === "anthropic" ? "required" : "optional", present: has("ANTHROPIC_API_KEY") },

  { group: "Email", name: "RESEND_API_KEY", mode: "optional", present: has("RESEND_API_KEY") },
  { group: "Email", name: "FROM_EMAIL", mode: "optional", present: Boolean(fromEmail) },

  { group: "SMS", name: "TWILIO_ACCOUNT_SID", mode: "optional", present: has("TWILIO_ACCOUNT_SID") },
  { group: "SMS", name: "TWILIO_AUTH_TOKEN", mode: "optional", present: has("TWILIO_AUTH_TOKEN") },
  { group: "SMS", name: "TWILIO_MESSAGING_SERVICE_SID", mode: "optional", present: has("TWILIO_MESSAGING_SERVICE_SID") },
  { group: "SMS", name: "TWILIO_PHONE_NUMBER", mode: "optional", present: has("TWILIO_PHONE_NUMBER") },

  { group: "Billing", name: "STRIPE_SECRET_KEY", mode: "optional", present: has("STRIPE_SECRET_KEY") },
  { group: "Billing", name: "STRIPE_WEBHOOK_SECRET", mode: "optional", present: has("STRIPE_WEBHOOK_SECRET") },
  { group: "Billing", name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", mode: "optional", present: has("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") },
  { group: "Billing", name: "NEXT_PUBLIC_STRIPE_PRICE_STARTER", mode: "optional", present: has("NEXT_PUBLIC_STRIPE_PRICE_STARTER") },
  { group: "Billing", name: "NEXT_PUBLIC_STRIPE_PRICE_PRO", mode: "optional", present: has("NEXT_PUBLIC_STRIPE_PRICE_PRO") },
  { group: "Billing", name: "NEXT_PUBLIC_STRIPE_PRICE_BUSINESS", mode: "optional", present: has("NEXT_PUBLIC_STRIPE_PRICE_BUSINESS") },
  { group: "Billing", name: "NEXT_PUBLIC_STRIPE_PRICE_AGENCY", mode: "optional", present: has("NEXT_PUBLIC_STRIPE_PRICE_AGENCY") },

  { group: "App", name: "NEXT_PUBLIC_APP_URL", mode: "optional", present: has("NEXT_PUBLIC_APP_URL"), note: "defaults to http://localhost:3000" },
  { group: "App", name: "ADMIN_EMAILS", mode: "optional", present: has("ADMIN_EMAILS"), note: "super-admin allowlist for /app/admin" },
];

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

console.log(`\nReviewLoop AI — environment check  (AI provider: ${provider})\n`);

let lastGroup = "";
const missingRequired: string[] = [];
const missingOptional: string[] = [];

for (const c of checks) {
  if (c.group !== lastGroup) {
    console.log(`${DIM}${c.group}${RESET}`);
    lastGroup = c.group;
  }
  const ok = c.present;
  const required = c.mode === "required";
  const icon = ok ? `${GREEN}✓${RESET}` : required ? `${RED}✗${RESET}` : `${YELLOW}–${RESET}`;
  const label = ok ? "configured" : required ? "MISSING (required)" : "not set (optional)";
  const note = c.note ? ` ${DIM}(${c.note})${RESET}` : "";
  console.log(`  ${icon} ${c.name}: ${label}${note}`);
  if (!ok && required) missingRequired.push(c.name);
  if (!ok && !required) missingOptional.push(c.name);
}

console.log("");
if (missingRequired.length > 0) {
  console.log(`${RED}FAIL${RESET}: ${missingRequired.length} required var(s) missing: ${missingRequired.join(", ")}`);
  console.log(`${DIM}Set these in .env.local (see .env.example).${RESET}\n`);
  process.exit(1);
}
console.log(`${GREEN}OK${RESET}: all required vars for mode "${provider}" are set.`);
if (missingOptional.length > 0) {
  console.log(`${YELLOW}${missingOptional.length} optional integration var(s) not set${RESET} — those features stay in mock/disabled mode.`);
}
console.log("");
process.exit(0);
