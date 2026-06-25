import Link from "next/link";
import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AddCustomerPanel } from "./customer-forms";
import { setOptOutAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";

export const metadata = { title: "Customers — ReviewLoop AI" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const org = await requireOrg();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("*")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }

  const { data: customers } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">
            Add the customers you&apos;ve served, then send review requests.
          </p>
        </div>
        <form className="flex gap-2" action="/app/customers">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name, email, phone"
            className="input w-64"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <AddCustomerPanel />

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {customers?.length ?? 0} customer(s)
            </h2>
            <LinkButton href="/app/requests" size="sm" variant="outline">
              Send review requests →
            </LinkButton>
          </div>

          {!customers || customers.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-500">
              No customers yet. Add your first one above.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Contact</th>
                    <th className="py-2 pr-4">Service</th>
                    <th className="py-2 pr-4">Consent</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 pr-4 font-medium text-gray-900">{c.name}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        <div>{c.email || "—"}</div>
                        <div className="text-xs text-gray-400">{c.phone || ""}</div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        <div>{c.service_type || "—"}</div>
                        <div className="text-xs text-gray-400">{c.service_date || ""}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1">
                          {c.consent_email ? <Badge tone="blue">Email</Badge> : null}
                          {c.consent_sms ? <Badge tone="blue">SMS</Badge> : null}
                          {!c.consent_email && !c.consent_sms ? (
                            <span className="text-xs text-gray-400">None</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {c.opt_out ? (
                          <Badge tone="red">Opted out</Badge>
                        ) : (
                          <Badge tone="green">Active</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <form action={setOptOutAction}>
                            <input type="hidden" name="customerId" value={c.id} />
                            <input type="hidden" name="optOut" value={c.opt_out ? "false" : "true"} />
                            <Button type="submit" size="sm" variant="ghost">
                              {c.opt_out ? "Re-enable" : "Opt out"}
                            </Button>
                          </form>
                          <Link
                            href={`/app/requests?customer=${c.id}`}
                            className="text-sm font-medium text-brand-600 hover:underline"
                          >
                            Request
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
