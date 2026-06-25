import { verifyOptOutToken } from "@/lib/compliance/optout-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { confirmOptOutAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unsubscribe — ReviewLoop AI" };

/** Best-effort business name so the page reads naturally. Never required. */
async function businessNameFor(customerId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: customer } = await admin
    .from("customers")
    .select("organization_id")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer?.organization_id) return null;
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", customer.organization_id)
    .maybeSingle();
  return org?.name ?? null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {children}
      </div>
      <p className="mt-4 text-center text-xs text-gray-400">Powered by ReviewLoop AI</p>
    </main>
  );
}

export default async function OptOutPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { token } = await params;
  const { done, error } = await searchParams;
  const customerId = verifyOptOutToken(token);

  if (!customerId) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold text-gray-900">This link isn’t valid</h1>
        <p className="mt-2 text-sm text-gray-600">
          This unsubscribe link is invalid or has expired. If you’re still receiving messages you
          don’t want, please reply to the message and ask to be removed.
        </p>
      </Shell>
    );
  }

  if (done === "1") {
    return (
      <Shell>
        <h1 className="text-lg font-semibold text-gray-900">You’re unsubscribed</h1>
        <p className="mt-2 text-sm text-gray-600">
          You won’t receive any more review request messages. Thank you.
        </p>
      </Shell>
    );
  }

  if (error === "unavailable") {
    return (
      <Shell>
        <h1 className="text-lg font-semibold text-gray-900">Temporarily unavailable</h1>
        <p className="mt-2 text-sm text-gray-600">
          We couldn’t process your request right now. Please try again shortly, or reply to the
          message asking to be removed.
        </p>
      </Shell>
    );
  }

  const businessName = await businessNameFor(customerId);

  return (
    <Shell>
      <h1 className="text-lg font-semibold text-gray-900">Unsubscribe from review requests</h1>
      <p className="mt-2 text-sm text-gray-600">
        {businessName
          ? `Stop receiving review request messages from ${businessName}.`
          : "Stop receiving review request messages."}{" "}
        This takes effect immediately and won’t affect any service you’ve received.
      </p>
      {error === "failed" ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Something went wrong. Please try again.
        </p>
      ) : null}
      <form action={confirmOptOutAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" className="w-full">
          Unsubscribe me
        </Button>
      </form>
    </Shell>
  );
}
