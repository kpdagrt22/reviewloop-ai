import { LinkButton, Button } from "@/components/ui/button";
import { signOutAction } from "@/app/(auth)/actions";

export function Topbar({ email }: { email?: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <LinkButton href="/app/reviews/new" size="sm">
          + Paste review
        </LinkButton>
        <LinkButton href="/app/customers" size="sm" variant="outline">
          + Add customer
        </LinkButton>
      </div>
      <div className="flex items-center gap-3">
        {email ? <span className="hidden text-sm text-gray-500 sm:inline">{email}</span> : null}
        <form action={signOutAction}>
          <Button type="submit" size="sm" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
