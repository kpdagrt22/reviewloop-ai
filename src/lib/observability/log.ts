/**
 * Minimal structured logging + a single seam for error reporting.
 *
 * Today these write structured lines to the console. Wiring a real monitor
 * (Sentry, Logflare, Axiom, …) means implementing the body of `report` once —
 * call sites never change. Never pass secrets or full PII payloads in `fields`;
 * prefer ids and counts.
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

/** Override target for an external monitor (T11). Left undefined = console only. */
let externalSink: ((level: LogLevel, message: string, fields?: LogFields) => void) | undefined;

export function setExternalSink(
  sink: (level: LogLevel, message: string, fields?: LogFields) => void,
): void {
  externalSink = sink;
}

function emit(level: LogLevel, message: string, fields?: LogFields): void {
  const line = `[${level}] ${message}`;
  if (level === "error") console.error(line, fields ?? {});
  else if (level === "warn") console.warn(line, fields ?? {});
  else console.info(line, fields ?? {});
  try {
    externalSink?.(level, message, fields);
  } catch {
    // A failing monitor must never break the request path.
  }
}

export function logInfo(message: string, fields?: LogFields): void {
  emit("info", message, fields);
}

export function logWarn(message: string, fields?: LogFields): void {
  emit("warn", message, fields);
}

export function logError(message: string, fields?: LogFields): void {
  emit("error", message, fields);
}

/**
 * Reports a Supabase/Postgrest write error if present. Returns true when there
 * WAS an error (so callers can branch), false when the write was clean. Use this
 * to stop swallowing failed writes in fire-and-forget (void) server actions.
 */
export function reportDbError(
  where: string,
  error: { message: string } | null | undefined,
  fields?: LogFields,
): boolean {
  if (!error) return false;
  logError(`db write failed: ${where}: ${error.message}`, fields);
  return true;
}
