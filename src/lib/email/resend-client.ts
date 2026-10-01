import { Resend } from "resend";
import { getSenderConfig, isResendConfigured } from "./config";

export interface SendEmailResult {
  status: "sent" | "simulated" | "failed";
  resendMessageId: string | null;
  error: string | null;
}

/**
 * Sends via Resend when RESEND_API_KEY is configured (SENDER_EMAIL is optional);
 * otherwise simulates the send (no third-party call is made) and logs it as
 * `simulated`. Never called except from an explicit founder "Send" action —
 * this function has no idea what triggered it, so that guarantee lives in
 * the callers, not here.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<SendEmailResult> {
  if (!isResendConfigured()) {
    return { status: "simulated", resendMessageId: null, error: null };
  }

  const { senderName, senderEmail } = getSenderConfig();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });

    if (result.error) {
      return { status: "failed", resendMessageId: null, error: result.error.message };
    }

    return { status: "sent", resendMessageId: result.data?.id ?? null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "failed", resendMessageId: null, error: message };
  }
}
