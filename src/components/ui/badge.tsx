import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "gray" | "green" | "yellow" | "red" | "blue";

const tones: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700 ring-gray-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  yellow: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
};

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Map a sentiment string to a badge tone. */
export function sentimentTone(s?: string | null): Tone {
  if (s === "positive") return "green";
  if (s === "negative") return "red";
  return "gray";
}

/** Map a star rating to a badge tone. */
export function ratingTone(r?: number | null): Tone {
  if (r == null) return "gray";
  if (r >= 4) return "green";
  if (r === 3) return "yellow";
  return "red";
}
