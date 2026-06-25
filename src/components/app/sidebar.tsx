"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/app", label: "Dashboard", icon: "📊", exact: true },
  { href: "/app/customers", label: "Customers", icon: "👥" },
  { href: "/app/requests", label: "Review requests", icon: "✉️" },
  { href: "/app/reviews", label: "Reviews", icon: "⭐" },
  { href: "/app/testimonials", label: "Testimonials", icon: "💬" },
  { href: "/app/social", label: "Social posts", icon: "📣" },
  { href: "/app/report", label: "Weekly report", icon: "📈" },
  { href: "/app/billing", label: "Billing", icon: "💳" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
  { href: "/app/admin", label: "Admin / Debug", icon: "🛠️" },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white md:block">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
          ★
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{orgName}</p>
          <p className="text-xs text-gray-400">ReviewLoop AI</p>
        </div>
      </div>
      <nav className="space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
