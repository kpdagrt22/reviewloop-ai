/**
 * Review request lifecycle. A request moves forward through these states.
 * Transitions are validated so the UI/server can't accidentally regress a
 * request (e.g. mark a completed request as draft).
 */
export const REQUEST_STATUSES = [
  "draft",
  "sent",
  "clicked",
  "completed",
  "cancelled",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

const ALLOWED: Record<RequestStatus, RequestStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["clicked", "completed", "cancelled"],
  clicked: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  if (from === to) return false;
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: RequestStatus, to: RequestStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid review request transition: ${from} → ${to}`);
  }
}

/** Timestamp column that should be stamped when entering a given status. */
export function timestampFieldFor(status: RequestStatus): string | null {
  switch (status) {
    case "sent":
      return "sent_at";
    case "clicked":
      return "clicked_at";
    case "completed":
      return "completed_at";
    default:
      return null;
  }
}
