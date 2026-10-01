import { z } from "zod";

export const EmailDraftSchema = z.object({
  subject: z.string(),
  body: z
    .string()
    .describe(
      "Full plain-text email body with \\n line breaks: greeting line, 2–3 short paragraphs separated by blank lines, then the sign-off on its own lines. Warm, specific to the candidate's CV, signed with the sender's name provided in context.",
    ),
});

export type EmailDraftOutput = z.infer<typeof EmailDraftSchema>;
