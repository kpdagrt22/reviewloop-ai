/**
 * Returns a safe, same-origin relative redirect path. Rejects anything that
 * isn't a plain absolute path on this origin — in particular protocol-relative
 * (`//host`) and backslash (`/\host`) values that browsers treat as off-site.
 * Falls back to `fallback` (default "/app"). Prevents open-redirect / phishing.
 */
export function safeNextPath(
  raw: unknown,
  fallback = "/app",
): string {
  const next = typeof raw === "string" ? raw : "";
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
