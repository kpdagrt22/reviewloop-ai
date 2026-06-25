import { hasResend, fromEmail } from "@/lib/env";

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  /** "resend" when actually sent, "mock" when logged only. */
  via: "resend" | "mock";
  id?: string;
  error?: string;
}

/**
 * Email adapter. Uses Resend when configured, otherwise no-ops to a console log
 * so the request workflow still completes in development. The `resend` package
 * is an optional dependency, imported dynamically.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  if (!hasResend()) {
    console.info("[email:mock]", params.to, "-", params.subject);
    return { ok: true, via: "mock" };
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { data, error } = await resend.emails.send({
      from: fromEmail(),
      to: params.to,
      subject: params.subject,
      text: params.body,
      replyTo: params.replyTo,
    });
    if (error) return { ok: false, via: "resend", error: error.message };
    return { ok: true, via: "resend", id: data?.id };
  } catch (err) {
    return { ok: false, via: "resend", error: (err as Error).message };
  }
}
