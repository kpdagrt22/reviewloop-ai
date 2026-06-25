import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { getActiveOrg, requireUser } from "@/lib/auth/session";

export const metadata = { title: "Set up your business — ReviewLoop AI" };

// Per-request: depends on the auth session.
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  // If they already have an org, skip onboarding.
  const org = await getActiveOrg();
  if (org) redirect("/app");

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container-page max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Set up your business</h1>
          <p className="mt-1 text-gray-600">
            A few details and you&apos;re ready to start collecting reviews.
          </p>
        </div>
        <OnboardingForm defaultEmail={user.email ?? ""} />
      </div>
    </div>
  );
}
