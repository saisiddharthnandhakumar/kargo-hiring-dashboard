import { extractCandidateEvidence, EVIDENCE_EXTRACTION_PROMPT_VERSION } from "@/lib/ai/evidence-extraction";
import { scoreCandidateAgainstRubric, RUBRIC_SCORING_PROMPT_VERSION } from "@/lib/ai/rubric-scoring";
import { fromEvidenceOutput, toEvidenceOutput } from "@/lib/ai/evidence-adapter";
import type { CandidateEvidenceOutput } from "@/lib/ai/schemas/evidence";
import { stripPii } from "@/lib/parsing/pii-strip";
import { getRepositories, type CandidateEvidence, type CandidateScore } from "@/lib/repositories";
import { aggregateScore } from "@/lib/scoring/aggregate";
import { getRubric, type RoleKey } from "@/lib/rubric";

export type PipelineResult =
  | { ok: true; evidence: CandidateEvidence; score: CandidateScore }
  | { ok: false; error: string };

async function scoreAndSave(params: {
  applicationId: string;
  role: RoleKey;
  evidenceOutput: CandidateEvidenceOutput;
}): Promise<{ ok: true; score: CandidateScore } | { ok: false; error: string }> {
  const repos = getRepositories();

  const scoringResult = await scoreCandidateAgainstRubric({
    role: params.role,
    evidence: params.evidenceOutput,
  });
  if (!scoringResult.ok) return { ok: false, error: scoringResult.error };

  const aggregate = aggregateScore({ role: params.role, criteria: scoringResult.data.criteria });
  if (!aggregate.ok) {
    return {
      ok: false,
      error: `Model returned an invalid scoring shape: ${aggregate.error}`,
    };
  }

  const score = await repos.scores.upsert(params.applicationId, {
    overallScore: aggregate.overallScore,
    whySurfaced: scoringResult.data.whySurfaced,
    criteria: aggregate.criteria,
    historicalSignal: aggregate.historicalSignal,
    strengths: scoringResult.data.strengths,
    concerns: scoringResult.data.concerns,
    interviewQuestions: scoringResult.data.interviewQuestions,
    modelId: scoringResult.modelId,
    promptVersion: RUBRIC_SCORING_PROMPT_VERSION,
  });

  return { ok: true, score };
}

/**
 * Full pipeline for a NEW (or previously PROCESSING_FAILED) application:
 * extract evidence from the candidate's already-stored CV text, score it
 * against the role's rubric, and save both. Shared by both the single
 * upload route and the batch processor so their behavior never diverges.
 */
export async function processApplication(applicationId: string): Promise<PipelineResult> {
  const repos = getRepositories();

  const application = await repos.applications.getById(applicationId);
  if (!application) return { ok: false, error: `Application not found: ${applicationId}` };

  const candidate = await repos.candidates.getById(application.candidateId);
  if (!candidate) return { ok: false, error: `Candidate not found for application: ${applicationId}` };

  await repos.applications.updateStatus(applicationId, "PROCESSING");

  const roleTitle = getRubric(application.roleKey).roleTitle;
  const strippedText = stripPii(candidate.rawText);

  const evidenceResult = await extractCandidateEvidence({ cvText: strippedText, roleTitle });
  if (!evidenceResult.ok) {
    await repos.applications.updateStatus(applicationId, "PROCESSING_FAILED", evidenceResult.error);
    return { ok: false, error: evidenceResult.error };
  }

  const evidence = await repos.evidence.upsert(
    applicationId,
    fromEvidenceOutput(evidenceResult.data, {
      modelId: evidenceResult.modelId,
      promptVersion: EVIDENCE_EXTRACTION_PROMPT_VERSION,
    }),
  );

  const scoreOutcome = await scoreAndSave({
    applicationId,
    role: application.roleKey,
    evidenceOutput: evidenceResult.data,
  });
  if (!scoreOutcome.ok) {
    await repos.applications.updateStatus(applicationId, "PROCESSING_FAILED", scoreOutcome.error);
    return { ok: false, error: scoreOutcome.error };
  }

  await repos.applications.updateStatus(applicationId, "REVIEWED");
  return { ok: true, evidence, score: scoreOutcome.score };
}

/**
 * Re-runs scoring only, from already-cached evidence — never re-parses or
 * re-extracts the CV. Leaves the founder's current status alone on success
 * (re-scoring shouldn't silently move a SHORTLISTED candidate back to
 * REVIEWED); marks PROCESSING_FAILED on failure so the founder sees it.
 */
export async function rescoreApplication(applicationId: string): Promise<PipelineResult> {
  const repos = getRepositories();

  const application = await repos.applications.getById(applicationId);
  if (!application) return { ok: false, error: `Application not found: ${applicationId}` };

  const cachedEvidence = await repos.evidence.getByApplicationId(applicationId);
  if (!cachedEvidence) {
    return {
      ok: false,
      error: "No cached evidence for this application yet — process it first.",
    };
  }

  const scoreOutcome = await scoreAndSave({
    applicationId,
    role: application.roleKey,
    evidenceOutput: toEvidenceOutput(cachedEvidence),
  });
  if (!scoreOutcome.ok) {
    await repos.applications.updateStatus(applicationId, "PROCESSING_FAILED", scoreOutcome.error);
    return { ok: false, error: scoreOutcome.error };
  }

  return { ok: true, evidence: cachedEvidence, score: scoreOutcome.score };
}
