import type { CriterionResult, HistoricalSignalResult } from "@/lib/scoring/types";
import type { CandidateEvidenceOutput } from "./schemas/evidence";
import { InterviewBriefSchema, type InterviewBriefOutput } from "./schemas/brief";
import { buildInterviewBriefPrompt, INTERVIEW_BRIEF_PROMPT_VERSION } from "./prompts/interview-brief";
import { generateStructured, type StructuredGenerationResult } from "./generate-with-retry";

export { INTERVIEW_BRIEF_PROMPT_VERSION };

export async function generateInterviewBrief(input: {
  candidateName: string;
  roleTitle: string;
  overallScore: number;
  criteria: CriterionResult[];
  historicalSignal: HistoricalSignalResult;
  evidence: CandidateEvidenceOutput;
}): Promise<StructuredGenerationResult<InterviewBriefOutput>> {
  const { system, prompt } = buildInterviewBriefPrompt(input);
  return generateStructured({ schema: InterviewBriefSchema, system, prompt });
}
