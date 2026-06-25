import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { setSocialStatusAction, deleteSocialPostAction } from "./actions";

export const metadata = { title: "Social posts — ReviewLoop AI" };

const statusTone: Record<string, "gray" | "blue" | "green"> = {
  draft: "gray",
  approved: "blue",
  posted: "green",
};

export default async function SocialPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("social_posts")
    .select("*")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Social posts</h1>
        <p className="text-sm text-gray-500">
          Text drafts created from your best reviews. Copy and post them yourself —
          ReviewLoop never auto-posts to social media.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Confirm you have the right to reuse a customer&apos;s words and name before publishing.
      </div>

      {!posts || posts.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-500">
              No social posts yet. Open a positive review and save a social post draft.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((p) => (
            <div key={p.id} className="card">
              <div className="card-body space-y-3">
                <div className="flex items-center justify-between">
                  <Badge tone={statusTone[p.status] ?? "gray"}>{p.status}</Badge>
                  <span className="text-xs capitalize text-gray-400">{p.platform ?? "social"}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{p.post_text}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <CopyButton text={p.post_text ?? ""} label="Copy post" />
                  {p.status !== "posted" ? (
                    <form action={setSocialStatusAction}>
                      <input type="hidden" name="postId" value={p.id} />
                      <input type="hidden" name="status" value="posted" />
                      <Button type="submit" variant="outline">
                        Mark as used
                      </Button>
                    </form>
                  ) : null}
                  <form action={deleteSocialPostAction}>
                    <input type="hidden" name="postId" value={p.id} />
                    <Button type="submit" variant="ghost">
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
