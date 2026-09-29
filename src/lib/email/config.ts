export const COMPANY_NAME = "Kargo";

export function getSenderConfig(): { senderName: string; senderEmail: string | null } {
  return {
    senderName: process.env.SENDER_NAME?.trim() || "Arjun Mehta",
    senderEmail: process.env.SENDER_EMAIL?.trim() || null,
  };
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.SENDER_EMAIL);
}
