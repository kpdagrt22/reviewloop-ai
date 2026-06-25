/**
 * seed — creates a demo organization with customers, reviews, a reply draft,
 * a negative-review alert, a testimonial, and a social post, so the product can
 * be demoed in minutes.
 *
 * Usage:  npm run seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (service role
 * bypasses RLS — this is a trusted local/ops script, never shipped to the client).
 *
 * Idempotent: re-running deletes the existing demo org (cascade) and recreates
 * it. The demo auth user is reused.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(file: string): void {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local first.",
  );
  process.exit(1);
}

const DEMO_EMAIL = "demo@reviewloop.test";
const DEMO_PASSWORD = "ReviewLoopDemo123!";
const ORG_NAME = "Sunshine Plumbing (Demo)";

const admin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findOrCreateUser(): Promise<string> {
  // Page through users to find the demo account (admin API has no get-by-email).
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const existing = data.users.find((u) => u.email === DEMO_EMAIL);
  if (existing) return existing.id;

  const created = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo Owner" },
  });
  if (created.error) throw created.error;
  return created.data.user!.id;
}

async function main() {
  console.log("Seeding demo data…");
  const userId = await findOrCreateUser();

  // Ensure a profile row exists (the trigger normally creates it).
  await admin.from("profiles").upsert({ id: userId, email: DEMO_EMAIL, full_name: "Demo Owner" });

  // Remove any prior demo org for a clean reseed (cascade clears children).
  await admin.from("organizations").delete().eq("owner_id", userId).eq("name", ORG_NAME);

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({
      owner_id: userId,
      name: ORG_NAME,
      business_type: "Plumbing",
      country: "United States",
      state: "California",
      city: "San Diego",
      timezone: "America/Los_Angeles",
      website: "https://example.com",
      phone: "+1 555 010 2030",
      google_review_link: "https://g.page/r/demo-sunshine-plumbing/review",
      brand_tone: "friendly",
      default_request_channel: "manual",
      escalation_email: DEMO_EMAIL,
    })
    .select("id")
    .single();
  if (orgErr || !org) throw orgErr ?? new Error("Failed to create org");
  const orgId = org.id;

  const customers = [
    { name: "Maria Gonzalez", email: "maria@example.com", phone: "+15550100001", service_type: "Drain cleaning", consent_email: true, consent_sms: false },
    { name: "James Patel", email: "james@example.com", phone: "+15550100002", service_type: "Water heater repair", consent_email: true, consent_sms: true },
    { name: "Aisha Khan", email: "aisha@example.com", phone: "+15550100003", service_type: "Leak repair", consent_email: false, consent_sms: false },
    { name: "Tom Becker", email: "tom@example.com", phone: "+15550100004", service_type: "Faucet install", consent_email: true, consent_sms: false },
    { name: "Linda Rossi", email: "linda@example.com", phone: "+15550100005", service_type: "Pipe replacement", consent_email: true, consent_sms: true },
    { name: "Chris Nguyen", email: "chris@example.com", phone: "+15550100006", service_type: "Sump pump", consent_email: false, consent_sms: false },
    { name: "Grace Liu", email: "grace@example.com", phone: "+15550100007", service_type: "Toilet repair", consent_email: true, consent_sms: false },
    { name: "Sam Carter", email: "sam@example.com", phone: "+15550100008", service_type: "Garbage disposal", consent_email: true, consent_sms: false },
  ];
  const { data: insertedCustomers, error: custErr } = await admin
    .from("customers")
    .insert(customers.map((c) => ({ ...c, organization_id: orgId })))
    .select("id, name");
  if (custErr) throw custErr;

  const byName = new Map((insertedCustomers ?? []).map((c) => [c.name, c.id]));

  const reviews = [
    { reviewer_name: "Maria G.", rating: 5, sentiment: "positive", text: "Great service. The technician arrived on time, explained the repair clearly, and fixed the issue quickly. Highly recommend.", customer: "Maria Gonzalez" },
    { reviewer_name: "James P.", rating: 5, sentiment: "positive", text: "Fast, friendly, and fairly priced. Our water heater works perfectly now.", customer: "James Patel" },
    { reviewer_name: "Grace L.", rating: 4, sentiment: "positive", text: "Good work overall and the plumber was polite. Took a little longer than expected.", customer: "Grace Liu" },
    { reviewer_name: "Chris N.", rating: 3, sentiment: "neutral", text: "The repair was fine but I had to follow up to schedule the visit.", customer: "Chris Nguyen" },
    { reviewer_name: "Tom B.", rating: 2, sentiment: "negative", text: "The appointment was delayed and I had to call twice for an update. The repair was fine, but communication could have been better.", customer: "Tom Becker" },
  ];

  for (const r of reviews) {
    const { data: review } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        customer_id: byName.get(r.customer) ?? null,
        platform: "Google",
        rating: r.rating,
        reviewer_name: r.reviewer_name,
        review_text: r.text,
        sentiment: r.sentiment,
        status: r.rating <= 2 ? "escalated" : "new",
      })
      .select("id")
      .single();
    if (!review) continue;

    // A pending reply draft for each review (owner approves before posting).
    const draft =
      r.rating <= 2
        ? "Hi, thank you for the honest feedback and I'm sorry about the delay and communication. I'd like to make this right — please reach out to us directly so we can help."
        : `Hi ${r.reviewer_name}, thank you so much for the kind words! We're glad we could help and look forward to working with you again.`;
    await admin.from("ai_reply_drafts").insert({
      organization_id: orgId,
      review_id: review.id,
      tone: "friendly",
      draft_text: draft,
      status: "draft",
      ai_confidence: 0.82,
    });

    if (r.rating <= 2) {
      await admin.from("notification_events").insert({
        organization_id: orgId,
        event_type: "negative_review_detected",
        metadata: { review_id: review.id, rating: r.rating, severity: "medium" },
      });
    }

    if (r.rating === 5) {
      await admin.from("testimonials").insert({
        organization_id: orgId,
        review_id: review.id,
        quote_text: r.text,
        customer_display_name: r.reviewer_name,
        service_type: "Plumbing",
        approved: r.reviewer_name.startsWith("Maria"),
      });
      await admin.from("social_posts").insert({
        organization_id: orgId,
        review_id: review.id,
        platform: "facebook",
        post_text: `⭐⭐⭐⭐⭐ "${r.text}" — ${r.reviewer_name}\n\nThank you for trusting ${ORG_NAME.replace(" (Demo)", "")}!`,
        status: "draft",
      });
    }
  }

  console.log("\nDemo data seeded ✓");
  console.log(`  Org:   ${ORG_NAME}`);
  console.log(`  Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log("  Sign in at /login, then explore /app.\n");
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
