import { AuthForm } from "../auth-form";
import { ConfigNotice } from "@/components/app/config-notice";
import { hasSupabase } from "@/lib/env";

export const metadata = { title: "Log in — ReviewLoop AI" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="card">
      <div className="card-body">
        <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Log in to your ReviewLoop dashboard.</p>
        <div className="mt-6">
          {hasSupabase() ? (
            <AuthForm mode="login" next={next} />
          ) : (
            <ConfigNotice
              title="Supabase not configured"
              body="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable login. See the README."
            />
          )}
        </div>
      </div>
    </div>
  );
}
