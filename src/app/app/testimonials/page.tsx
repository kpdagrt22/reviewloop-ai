import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { setTestimonialApprovedAction, deleteTestimonialAction } from "./actions";

export const metadata = { title: "Testimonials — ReviewLoop AI" };

export default async function TestimonialsPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
        <p className="text-sm text-gray-500">
          Approved testimonials from your happiest customers. Generate new ones from any
          positive review.
        </p>
      </div>

      {!testimonials || testimonials.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-500">
              No testimonials yet. Open a positive review and save it as a testimonial.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((t) => (
            <div key={t.id} className="card">
              <div className="card-body space-y-3">
                <div className="flex items-center justify-between">
                  <Badge tone={t.approved ? "green" : "gray"}>
                    {t.approved ? "Approved" : "Draft"}
                  </Badge>
                  {t.service_type ? (
                    <span className="text-xs text-gray-400">{t.service_type}</span>
                  ) : null}
                </div>
                <blockquote className="text-gray-800">“{t.quote_text}”</blockquote>
                <p className="text-sm font-medium text-gray-600">
                  — {t.customer_display_name || "Customer"}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <CopyButton text={`"${t.quote_text}" — ${t.customer_display_name || "Customer"}`} />
                  <form action={setTestimonialApprovedAction}>
                    <input type="hidden" name="testimonialId" value={t.id} />
                    <input type="hidden" name="approved" value={t.approved ? "false" : "true"} />
                    <Button type="submit" variant={t.approved ? "ghost" : "primary"} size="md">
                      {t.approved ? "Unapprove" : "Approve"}
                    </Button>
                  </form>
                  <form action={deleteTestimonialAction}>
                    <input type="hidden" name="testimonialId" value={t.id} />
                    <Button type="submit" variant="ghost" size="md">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
