/**
 * Canonical enum values, mirrored from the SQL CHECK constraints in
 * supabase/migrations. Validate any status/channel value that originates from
 * user input against these BEFORE writing it, so a bad value is rejected in the
 * app (a clear error) rather than by Postgres (an opaque 500) — or, worse,
 * silently written to a column that has no CHECK constraint.
 */

export const REVIEW_STATUSES = ["new", "replied", "escalated", "archived"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REPLY_DRAFT_STATUSES = ["draft", "approved", "posted", "discarded"] as const;
export type ReplyDraftStatus = (typeof REPLY_DRAFT_STATUSES)[number];

export const SOCIAL_POST_STATUSES = ["draft", "approved", "posted"] as const;
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number];

/** All channels an org may configure as a default. */
export const REQUEST_CHANNELS = ["manual", "email", "sms", "both"] as const;
export type RequestChannel = (typeof REQUEST_CHANNELS)[number];

/** Channels a single review request can actually be delivered on ("both" is a
 *  default-preference, not a per-request delivery target). */
export const DELIVERY_CHANNELS = ["manual", "email", "sms"] as const;
export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];

/** Narrowing membership check usable as a type guard. */
export function isOneOf<const T extends readonly string[]>(
  allowed: T,
  value: string,
): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}
