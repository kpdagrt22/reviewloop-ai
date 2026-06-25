import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { NewReviewForm } from "./review-form";

export const metadata = { title: "Add review — ReviewLoop AI" };

export default async function NewReviewPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const [{ data: customers }, { data: requests }] = await Promise.all([
    supabase
      .from("customers")
      .select("id,name")
      .eq("organization_id", org.id)
      .order("name", { ascending: true })
      .limit(200),
    supabase
      .from("review_requests")
      .select("id, channel, created_at, customer_id")
      .eq("organization_id", org.id)
      .in("status", ["sent", "clicked"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const nameById = new Map((customers ?? []).map((c) => [c.id, c.name]));
  const requestOptions = (requests ?? []).map((r) => {
    const name = (r.customer_id && nameById.get(r.customer_id)) || "customer";
    const when = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";
    return { id: r.id, label: `${name} · ${r.channel} · ${when}` };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paste a review</h1>
        <p className="text-sm text-gray-500">
          Add a review you received. ReviewLoop will analyze it and draft a reply.
        </p>
      </div>
      <NewReviewForm customers={customers ?? []} requests={requestOptions} />
    </div>
  );
}
