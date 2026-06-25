/**
 * Review request lifecycle. A request moves forward through these states.
 * Transitions are validated so the UI/server can't accidentally regress a
 * request (e.g. mark a completed request as draft).
 *
 *   draft → ready → sent → clicked → completed
 *     └──────┴───────┴───── cancelled
 *
 * `ready` is an optional staging state: a request can be prepared and reviewed
 * before it is actually sent/marked sent.
 */
export const REQUEST_STATUSES = [
  "draft",
  "ready",
  "sent",
  "clicked",
  "completed",
  "cancelled",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
/** Spec-named alias. */
export type ReviewRequestStatus = RequestStatus;

const ALLOWED: Record<RequestStatus, RequestStatus[]> = {
  draft: ["ready", "sent", "cancelled"],
  ready: ["sent", "cancelled"],
  sent: ["clicked", "completed", "cancelled"],
  clicked: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  if (from === to) return false;
  return ALLOWED[from]?.includes(to) ?? false;
}

/** Spec-named alias of {@link canTransition}. */
export const canTransitionReviewRequestStatus = canTransition;

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

const LABELS: Record<RequestStatus, string> = {
  draft: "Draft",
  ready: "Ready to send",
  sent: "Sent",
  clicked: "Clicked",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function getReviewRequestStatusLabel(status: string): string {
  return LABELS[status as RequestStatus] ?? status;
}

/** Badge tone (matches the UI Badge component's tones). */
export type BadgeVariant = "gray" | "blue" | "green" | "yellow" | "red";

const BADGE_VARIANTS: Record<RequestStatus, BadgeVariant> = {
  draft: "gray",
  ready: "blue",
  sent: "blue",
  clicked: "yellow",
  completed: "green",
  cancelled: "red",
};

export function getReviewRequestStatusBadgeVariant(status: string): BadgeVariant {
  return BADGE_VARIANTS[status as RequestStatus] ?? "gray";
}
