import { AuthForm } from "../auth-form";
import { ConfigNotice } from "@/components/app/config-notice";
import { hasSupabase } from "@/lib/env";

export const metadata = { title: "Start Review Loop — ReviewLoop AI" };

export default function SignupPage() {
  return (
    <div className="card">
      <div className="card-body">
        <h1 className="text-xl font-semibold text-gray-900">Start Review Loop</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create your account — it takes about a minute.
        </p>
        <div className="mt-6">
          {hasSupabase() ? (
            <AuthForm mode="signup" />
          ) : (
            <ConfigNotice
              title="Supabase not configured"
              body="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable signup. See the README."
            />
          )}
        </div>
      </div>
    </div>
  );
}
