import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/service";
import { reviewAnalysisInputSchema } from "@/lib/ai/schemas/review-analysis";
import { getActiveOrg } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Best-effort per-org rate limit. NOTE: this is an in-memory window, so on
 * serverless it is per-instance, not global — it blunts accidental hammering and
 * obvious abuse but is not a hard guarantee. For a strict global limit, back this
 * with a shared store (e.g. Upstash/Redis or a Postgres counter).
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
const recentByOrg = new Map<string, number[]>();

function isRateLimited(orgId: string): boolean {
  const now = Date.now();
  const recent = (recentByOrg.get(orgId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  recentByOrg.set(orgId, recent);
  return recent.length > RATE_MAX;
}

/**
 * Stateless AI analysis endpoint. Requires an authenticated org (so it can't be
 * abused anonymously) but does NOT persist anything — useful for previews and
 * tests. POST a review payload; receive the validated analysis.
 */
export async function POST(req: Request) {
  const org = await getActiveOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(org.id)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again in a minute." },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => ({}));
  const parsed = reviewAnalysisInputSchema.safeParse({
    business_name: org.name,
    brand_tone: org.brand_tone,
    business_type: org.business_type ?? undefined,
    ...json,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const provider = getAIProvider();
    const analysis = await provider.analyzeReview(parsed.data);
    return NextResponse.json({ provider: provider.name, model: provider.model, analysis });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
