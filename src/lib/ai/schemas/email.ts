import { z } from "zod";

export const EmailDraftSchema = z.object({
  subject: z.string(),
  body: z
    .string()
    .describe(
      "Full email body, professional and warm, referencing specific evidence from the candidate's CV where natural. Signed off with the sender's name (provided in context) — do not invent a different sender.",
    ),
});

export type EmailDraftOutput = z.infer<typeof EmailDraftSchema>;
