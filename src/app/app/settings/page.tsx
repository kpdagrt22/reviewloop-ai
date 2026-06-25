import { requireOrg } from "@/lib/auth/session";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings — ReviewLoop AI" };

export default async function SettingsPage() {
  const org = await requireOrg();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">
          Update your review links, brand tone, and alert email.
        </p>
      </div>
      <SettingsForm org={org} />
    </div>
  );
}
