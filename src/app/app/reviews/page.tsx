import Link from "next/link";
import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, ratingTone, sentimentTone } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { shouldEscalate } from "@/lib/reviews/rules";

export const metadata = { title: "Reviews — ReviewLoop AI" };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const org = await requireOrg();
  const { filter } = await searchParams;
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const filtered =
    filter === "attention"
      ? (reviews ?? []).filter((r) => shouldEscalate(r.rating, null) || r.status === "escalated")
      : (reviews ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500">
            Every review you&apos;ve captured, with AI sentiment and reply status.
          </p>
        </div>
        <LinkButton href="/app/reviews/new" size="sm">
          + Paste review
        </LinkButton>
      </div>

      <div className="flex gap-2">
        <FilterTab href="/app/reviews" active={filter !== "attention"}>
          All
        </FilterTab>
        <FilterTab href="/app/reviews?filter=attention" active={filter === "attention"}>
          Needs attention
        </FilterTab>
      </div>

      <div className="card">
        <div className="card-body">
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-500">
              No reviews here yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {r.reviewer_name || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-400">{r.platform}</span>
                      {r.rating != null ? (
                        <Badge tone={ratingTone(r.rating)}>{r.rating}★</Badge>
                      ) : null}
                      {r.sentiment ? (
                        <Badge tone={sentimentTone(r.sentiment)}>{r.sentiment}</Badge>
                      ) : null}
                      {r.status === "escalated" ? <Badge tone="red">Needs attention</Badge> : null}
                      {r.status === "replied" ? <Badge tone="green">Replied</Badge> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{r.review_text}</p>
                  </div>
                  <Link
                    href={`/app/reviews/${r.id}`}
                    className="shrink-0 text-sm font-medium text-brand-600 hover:underline"
                  >
                    Open →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        active ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}
