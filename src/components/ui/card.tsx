import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("card-body", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "warn" | "good";
}) {
  const valueColor =
    tone === "warn" ? "text-red-600" : tone === "good" ? "text-green-600" : "text-gray-900";
  return (
    <div className="card">
      <div className="card-body">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold", valueColor)}>{value}</p>
        {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
      </div>
    </div>
  );
}
