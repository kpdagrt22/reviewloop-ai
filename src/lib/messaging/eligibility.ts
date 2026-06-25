/**
 * Consent & opt-out gating for outbound review-request messaging. Compliance
 * requires that we never message a customer who opted out, and never use a
 * channel they didn't consent to.
 */
export interface MessagingCustomer {
  email?: string | null;
  phone?: string | null;
  consent_email?: boolean | null;
  consent_sms?: boolean | null;
  opt_out?: boolean | null;
}

export type Channel = "email" | "sms";

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function canMessage(
  customer: MessagingCustomer,
  channel: Channel,
): EligibilityResult {
  if (customer.opt_out) {
    return { eligible: false, reason: "Customer has opted out of messaging." };
  }
  if (channel === "email") {
    if (!customer.email) return { eligible: false, reason: "No email on file." };
    if (!customer.consent_email) {
      return { eligible: false, reason: "No email consent on file." };
    }
    return { eligible: true };
  }
  // sms
  if (!customer.phone) return { eligible: false, reason: "No phone on file." };
  if (!customer.consent_sms) {
    return { eligible: false, reason: "No SMS consent on file." };
  }
  return { eligible: true };
}

/** Filter a list of customers down to those eligible for a channel. */
export function eligibleCustomers<T extends MessagingCustomer>(
  customers: T[],
  channel: Channel,
): T[] {
  return customers.filter((c) => canMessage(c, channel).eligible);
}
