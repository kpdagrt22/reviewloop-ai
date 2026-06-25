import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/service";
import { reviewAnalysisInputSchema } from "@/lib/ai/schemas/review-analysis";
import { getActiveOrg } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Stateless AI analysis endpoint. Requires an authenticated org (so it can't be
 * abused anonymously) but does NOT persist anything — useful for previews and
 * tests. POST a review payload; receive the validated analysis.
 */
export async function POST(req: Request) {
  const org = await getActiveOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
