import { getJobDescription } from "@/lib/jd";
import { HISTORICAL_PATTERNS, getRubric, type Rubric, type RoleKey } from "@/lib/rubric";
import type { CandidateEvidenceOutput } from "./schemas/evidence";
import { RubricScoringResponseSchema, type RubricScoringOutput } from "./schemas/score";
import { buildRubricScoringPrompt, RUBRIC_SCORING_PROMPT_VERSION } from "./prompts/rubric-scoring";
import { generateStructured, type StructuredGenerationResult } from "./generate-with-retry";

export { RUBRIC_SCORING_PROMPT_VERSION };

export async function scoreCandidateAgainstRubric(input: {
  role: RoleKey;
  evidence: CandidateEvidenceOutput;
  /** Defaults to the calibrated rubric; pass the effective one so the
   * prompt shows the founder's current weights. */
  rubric?: Rubric;
}): Promise<StructuredGenerationResult<RubricScoringOutput>> {
  const rubric = input.rubric ?? getRubric(input.role);
  const jd = getJobDescription(input.role);
  const { system, prompt } = buildRubricScoringPrompt({
    rubric,
    jdText: jd.text,
    historicalPatterns: HISTORICAL_PATTERNS,
    evidence: input.evidence,
  });
  return generateStructured({ schema: RubricScoringResponseSchema, system, prompt });
}
