import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { NewReviewForm } from "./review-form";

export const metadata = { title: "Add review — ReviewLoop AI" };

export default async function NewReviewPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id,name")
    .eq("organization_id", org.id)
    .order("name", { ascending: true })
    .limit(200);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paste a review</h1>
        <p className="text-sm text-gray-500">
          Add a review you received. ReviewLoop will analyze it and draft a reply.
        </p>
      </div>
      <NewReviewForm customers={customers ?? []} />
    </div>
  );
}
