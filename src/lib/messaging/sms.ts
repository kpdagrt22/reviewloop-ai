import { hasTwilio } from "@/lib/env";

export interface SendSmsParams {
  to: string;
  body: string;
}

export interface SmsResult {
  ok: boolean;
  via: "twilio" | "mock";
  id?: string;
  error?: string;
}

/**
 * SMS adapter. Uses Twilio when configured, otherwise mocks. The `twilio`
 * package is an optional dependency, imported dynamically so the app builds
 * without it installed.
 */
export async function sendSms(params: SendSmsParams): Promise<SmsResult> {
  if (!hasTwilio()) {
    console.info("[sms:mock]", params.to, "-", params.body.slice(0, 40));
    return { ok: true, via: "mock" };
  }
  try {
    const twilioModule = await import("twilio");
    const client = twilioModule.default(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );
    const msg = await client.messages.create({
      to: params.to,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
      body: params.body,
    });
    return { ok: true, via: "twilio", id: msg.sid };
  } catch (err) {
    return { ok: false, via: "twilio", error: (err as Error).message };
  }
}
