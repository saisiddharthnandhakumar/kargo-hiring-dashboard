import { z } from "zod";

export const CriterionScoreSchema = z.object({
  key: z.string().describe("Must exactly match one of the provided rubric criterion keys."),
  score: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("Integer 1-5 per the rubric's own anchors for this criterion. Score conservatively."),
  rationale: z
    .string()
    .describe("1-3 sentences explaining the score, referencing the anchor it matches."),
  evidenceRefs: z
    .array(z.string())
    .describe("Exact or closely paraphrased quotes from the candidate evidence supporting this score."),
  confidence: z.number().min(0).max(1),
  missingEvidence: z
    .string()
    .nullable()
    .describe(
      "What evidence would be needed to justify a higher score, or null if evidence is fully sufficient.",
    ),
});

// overallScore and historicalSignals are deliberately NOT part of this
// schema — those are computed only by lib/scoring/aggregate.ts, never by
// the model.
export const RubricScoringResponseSchema = z.object({
  whySurfaced: z
    .string()
    .describe(
      "One concise, evidence-grounded paragraph (2-3 sentences) explaining why this candidate surfaced — never generic language like 'great candidate.'",
    ),
  criteria: z.array(CriterionScoreSchema).length(5),
  strengths: z.array(z.string()).describe("2-4 evidence-backed strengths, not generic praise."),
  concerns: z
    .array(z.string())
    .describe("2-4 concrete concerns or gaps — missing evidence, ambiguity, or contradictions."),
  interviewQuestions: z
    .array(z.string())
    .describe(
      "2-4 questions tied to this specific candidate's CV that would validate the most uncertain scores — never generic questions like 'tell me about a time you showed initiative'.",
    ),
});

export type RubricScoringOutput = z.infer<typeof RubricScoringResponseSchema>;
