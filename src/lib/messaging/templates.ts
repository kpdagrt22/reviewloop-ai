/**
 * Review-request message templating. We keep the default message neutral — it
 * asks for honest feedback and never pressures only-positive reviews, never
 * conditions the ask on a positive experience, and never gates negative ones
 * (Google policy + ReviewLoop compliance). It also includes opt-out language so
 * the shipped copy satisfies the messaging consent checklist in COMPLIANCE.md.
 */
export interface TemplateContext {
  customerName: string;
  businessName: string;
  reviewLink: string;
}

export const DEFAULT_REQUEST_SUBJECT = "How was your experience with {{business}}?";

export const DEFAULT_REQUEST_BODY =
  "Hi {{name}}, thanks for choosing {{business}}. We'd love your honest feedback — " +
  "would you mind leaving a quick review? It helps local customers find us: {{link}} " +
  "If you'd prefer not to receive messages like this, reply STOP and we won't send any more.";

/** Replace {{name}}, {{business}}, {{link}} tokens. Unknown tokens are left intact. */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  return template
    .replaceAll("{{name}}", ctx.customerName || "there")
    .replaceAll("{{business}}", ctx.businessName)
    .replaceAll("{{link}}", ctx.reviewLink)
    // Tolerate the bracket style used in the PRD copy too.
    .replaceAll("[Name]", ctx.customerName || "there")
    .replaceAll("[Business]", ctx.businessName)
    .replaceAll("[Google Review Link]", ctx.reviewLink);
}

export function renderDefaultRequest(ctx: TemplateContext): {
  subject: string;
  body: string;
} {
  return {
    subject: renderTemplate(DEFAULT_REQUEST_SUBJECT, ctx),
    body: renderTemplate(DEFAULT_REQUEST_BODY, ctx),
  };
}
