import { z } from "zod";

function evidenceSignal<T extends z.ZodTypeAny>(value: T) {
  return z.object({
    value,
    evidence: z
      .string()
      .describe(
        'The exact quoted or closely paraphrased text from the CV supporting this value. If not found in the CV, use "Not found in CV" and set basis to "inferred" only if you are stating an absence, never to invent a value.',
      ),
    confidence: z.number().min(0).max(1).describe("0-1 confidence in this value."),
    basis: z
      .enum(["explicit", "inferred"])
      .describe(
        '"explicit" only if the CV states this directly. "inferred" if you had to read between the lines — inferred evidence should also lower confidence.',
      ),
  });
}

export const CandidateEvidenceSchema = z.object({
  candidate: z.object({
    name: z.string().describe("Candidate's full name as it appears on the CV."),
    currentRole: z.string().describe("Candidate's current or most recent job title."),
  }),
  currentRole: evidenceSignal(z.string()),
  yearsExperience: evidenceSignal(z.number()),
  companies: evidenceSignal(z.array(z.string())),
  education: evidenceSignal(z.array(z.string())),
  logisticsExperience: evidenceSignal(
    z
      .string()
      .describe(
        'Whether the candidate personally performed freight/logistics/customs/port/carrier/supply-chain operations work — not merely sold to or built software for logistics clients. Summarize what they actually did, or "Not found in CV".',
      ),
  ),
  productExperience: evidenceSignal(z.string()),
  technicalExperience: evidenceSignal(z.string()),
  ownershipExamples: evidenceSignal(z.array(z.string())),
  decisionExamples: evidenceSignal(z.array(z.string())),
  discoveryExamples: evidenceSignal(z.array(z.string())),
  stakeholderSignals: evidenceSignal(z.array(z.string())),
  careerTransitions: evidenceSignal(z.array(z.string())),
  measurableOutcomes: evidenceSignal(z.array(z.string())),
  rawEvidence: z
    .string()
    .describe("Any other notable evidence from the CV not captured by the fields above."),
});

export type CandidateEvidenceOutput = z.infer<typeof CandidateEvidenceSchema>;
