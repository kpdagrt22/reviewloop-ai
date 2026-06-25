import { requireOrg, getUser } from "@/lib/auth/session";
import { loadAdminDiagnostics } from "@/lib/data/admin";
import { adminEmails, isAdminEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { reportDbError } from "@/lib/observability/log";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/card";

export const metadata = { title: "Admin / Debug — ReviewLoop AI" };

// Per-request diagnostics for the signed-in org.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const org = await requireOrg();
  const user = await getUser();

  // Access control: a configured ADMIN_EMAILS allowlist gates this page. When no
  // allowlist is set, fall back to the organization owner only — never open.
  const allowlist = adminEmails();
  const authorized =
    isAdminEmail(user?.email) ||
    (allowlist.length === 0 && user?.id === org.owner_id);

  if (!authorized) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card">
          <div className="card-body text-center">
            <h1 className="text-xl font-semibold text-gray-900">Restricted</h1>
            <p className="mt-2 text-sm text-gray-500">
              The internal admin/debug page is limited to administrators. Ask an
              owner to add your email to <code>ADMIN_EMAILS</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Audit trail: record that an admin viewed internal diagnostics. Best-effort —
  // a logging failure must never block the page. Visible in "Recent events" below.
  const supabase = await createClient();
  const { error: auditErr } = await supabase.from("notification_events").insert({
    organization_id: org.id,
    event_type: "admin_diagnostics_viewed",
    metadata: { email: user?.email ?? null },
  });
  reportDbError("notification_events.insert(admin_view)", auditErr, { orgId: org.id });

  const diag = await loadAdminDiagnostics(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin / Debug</h1>
        <p className="text-sm text-gray-500">
          Internal diagnostics for {org.name}. Shows configuration status and activity for this
          organization only — no secret values or other businesses&apos; data are shown.
        </p>
      </div>

      {/* Config / feature flags */}
      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-gray-900">Configuration</h2>
          <p className="mb-4 text-sm text-gray-500">
            Whether each integration is configured. Keys themselves are never displayed.
          </p>
          <ul className="divide-y divide-gray-100">
            {diag.flags.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-gray-900">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.detail}</p>
                </div>
                <Badge tone={f.enabled ? "green" : "gray"}>
                  {f.enabled ? "Enabled" : "Mock / off"}
                </Badge>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-gray-900">AI provider / model</p>
                <p className="text-xs text-gray-500">Active provider used for analysis</p>
              </div>
              <Badge tone="blue">
                {diag.provider.name} · {diag.provider.model}
              </Badge>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-gray-900">Subscription</p>
                <p className="text-xs text-gray-500">Current billing state</p>
              </div>
              <Badge tone={diag.subscription?.status === "active" ? "green" : "gray"}>
                {diag.subscription?.plan ?? "none"} · {diag.subscription?.status ?? "—"}
              </Badge>
            </li>
          </ul>
        </div>
      </div>

      {/* Row counts */}
      <div>
        <h2 className="mb-3 font-semibold text-gray-900">Data (this organization)</h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(diag.counts).map(([table, count]) => (
            <StatCard key={table} label={table} value={count} />
          ))}
        </div>
      </div>

      {/* Recent AI logs */}
      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-gray-900">Recent AI calls</h2>
          {diag.recentAiLogs.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No AI calls logged yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Provider</th>
                    <th className="py-2 pr-4">Model</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {diag.recentAiLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2 pr-4 text-gray-500">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-gray-700">{l.provider ?? "—"}</td>
                      <td className="py-2 pr-4 text-gray-700">{l.model ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <Badge tone={l.status === "success" ? "green" : "red"}>
                          {l.status ?? "—"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-xs text-red-600">{l.error_message ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent events */}
      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-gray-900">Recent notification events</h2>
          {diag.recentEvents.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No events yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {diag.recentEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-gray-800">{e.event_type}</span>
                  <span className="text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        This page is for internal debugging. It honors row-level security and only reflects the
        current organization.
      </p>
    </div>
  );
}
