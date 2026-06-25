import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-gray-50">
      <header className="container-page py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            ★
          </span>
          ReviewLoop AI
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
