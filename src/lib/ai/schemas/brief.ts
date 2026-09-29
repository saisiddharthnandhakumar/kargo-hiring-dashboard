import { z } from "zod";

const questionSchema = z.object({
  question: z
    .string()
    .describe(
      "A question tied to a specific quote/claim from this candidate's CV — never a generic question like 'tell me about a time you showed initiative'.",
    ),
  probesFor: z.string().describe("Which strength or uncertainty this question is meant to validate."),
  whatAGoodAnswerShows: z.string(),
  whatWouldWeakenConfidence: z.string(),
});

export const InterviewBriefSchema = z.object({
  summary: z.string().describe("2-3 sentence candidate snapshot."),
  whyShortlisted: z
    .string()
    .describe("Why this candidate surfaced — grounded in specific rubric evidence, not generic praise."),
  strengths: z.array(z.string()).min(1).max(5).describe("Top evidence-backed strengths."),
  uncertainties: z.array(z.string()).min(1).max(5).describe("Top uncertainties or concerns to validate."),
  questions: z.array(questionSchema).min(3).max(6),
  followUpProbes: z
    .array(z.string())
    .describe("Shorter, open-ended follow-up prompts to use if an initial answer is thin."),
});

export type InterviewBriefOutput = z.infer<typeof InterviewBriefSchema>;
