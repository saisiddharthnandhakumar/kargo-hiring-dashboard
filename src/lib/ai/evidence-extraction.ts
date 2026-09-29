import { buildEvidenceExtractionPrompt, EVIDENCE_EXTRACTION_PROMPT_VERSION } from "./prompts/evidence-extraction";
import { CandidateEvidenceSchema, type CandidateEvidenceOutput } from "./schemas/evidence";
import { generateStructured, type StructuredGenerationResult } from "./generate-with-retry";

export { EVIDENCE_EXTRACTION_PROMPT_VERSION };

export async function extractCandidateEvidence(input: {
  cvText: string;
  roleTitle: string;
}): Promise<StructuredGenerationResult<CandidateEvidenceOutput>> {
  const { system, prompt } = buildEvidenceExtractionPrompt(input);
  return generateStructured({ schema: CandidateEvidenceSchema, system, prompt });
}
