import type { CandidateEvidence } from "@/lib/repositories";
import type { CandidateEvidenceOutput } from "./schemas/evidence";

/** Repository storage shape -> the exact AI schema shape, so cached
 * evidence can be fed back into scoring/brief prompts identically to a
 * freshly-extracted result (no re-extraction needed for "Re-score"). */
export function toEvidenceOutput(evidence: CandidateEvidence): CandidateEvidenceOutput {
  return {
    candidate: { name: evidence.candidateName, currentRole: evidence.candidateCurrentRoleTitle },
    currentRole: evidence.currentRole,
    yearsExperience: evidence.yearsExperience,
    companies: evidence.companies,
    education: evidence.education,
    logisticsExperience: evidence.logisticsExperience,
    productExperience: evidence.productExperience,
    technicalExperience: evidence.technicalExperience,
    ownershipExamples: evidence.ownershipExamples,
    decisionExamples: evidence.decisionExamples,
    discoveryExamples: evidence.discoveryExamples,
    stakeholderSignals: evidence.stakeholderSignals,
    careerTransitions: evidence.careerTransitions,
    measurableOutcomes: evidence.measurableOutcomes,
    rawEvidence: evidence.rawEvidence,
  };
}

/** AI schema output -> repository storage shape (minus id/applicationId/
 * createdAt, which the repository assigns on upsert). */
export function fromEvidenceOutput(
  output: CandidateEvidenceOutput,
  meta: { modelId: string; promptVersion: string },
): Omit<CandidateEvidence, "id" | "applicationId" | "createdAt"> {
  return {
    candidateName: output.candidate.name,
    candidateCurrentRoleTitle: output.candidate.currentRole,
    currentRole: output.currentRole,
    yearsExperience: output.yearsExperience,
    companies: output.companies,
    education: output.education,
    logisticsExperience: output.logisticsExperience,
    productExperience: output.productExperience,
    technicalExperience: output.technicalExperience,
    ownershipExamples: output.ownershipExamples,
    decisionExamples: output.decisionExamples,
    discoveryExamples: output.discoveryExamples,
    stakeholderSignals: output.stakeholderSignals,
    careerTransitions: output.careerTransitions,
    measurableOutcomes: output.measurableOutcomes,
    rawEvidence: output.rawEvidence,
    modelId: meta.modelId,
    promptVersion: meta.promptVersion,
  };
}
