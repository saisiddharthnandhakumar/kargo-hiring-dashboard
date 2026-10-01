export const COMPANY_NAME = "Kargo";

// Resend's shared sender works without a verified domain. Until a domain is
// verified, Resend only delivers it to the email address that owns the account.
const RESEND_DEFAULT_SENDER = "onboarding@resend.dev";

export function getSenderConfig(): { senderName: string; senderEmail: string | null } {
  const configured = process.env.SENDER_EMAIL?.trim();
  return {
    senderName: process.env.SENDER_NAME?.trim() || "Arjun Mehta",
    senderEmail: configured || (process.env.RESEND_API_KEY ? RESEND_DEFAULT_SENDER : null),
  };
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isUsingResendTestSender(): boolean {
  return isResendConfigured() && !process.env.SENDER_EMAIL?.trim();
}
