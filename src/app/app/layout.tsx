import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { getUser, requireOrg } from "@/lib/auth/session";

// Every authenticated route is per-request (auth session + org data via cookies).
// Force dynamic so the build never attempts to statically prerender them
// (which would fail without Supabase env vars present).
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Guards: requires auth + completed onboarding (redirects otherwise).
  const org = await requireOrg();
  const user = await getUser();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar orgName={org.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={user?.email} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
