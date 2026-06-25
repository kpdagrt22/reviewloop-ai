import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            ★
          </span>
          ReviewLoop AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
          <Link href="/#how" className="hover:text-gray-900">
            How it works
          </Link>
          <Link href="/#usecases" className="hover:text-gray-900">
            Use cases
          </Link>
          <Link href="/pricing" className="hover:text-gray-900">
            Pricing
          </Link>
          <Link href="/#faq" className="hover:text-gray-900">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LinkButton href="/login" variant="ghost" size="sm">
            Log in
          </LinkButton>
          <LinkButton href="/signup" size="sm">
            Start Review Loop
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 text-sm text-gray-500 sm:flex-row">
        <p>© {new Date().getFullYear()} ReviewLoop AI. Built for local service businesses.</p>
        <div className="flex gap-5">
          <Link href="/pricing" className="hover:text-gray-900">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-gray-900">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-gray-900">
            Get started
          </Link>
        </div>
      </div>
    </footer>
  );
}
