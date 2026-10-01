import { extractCandidateEvidence, EVIDENCE_EXTRACTION_PROMPT_VERSION } from "@/lib/ai/evidence-extraction";
import { scoreCandidateAgainstRubric, RUBRIC_SCORING_PROMPT_VERSION } from "@/lib/ai/rubric-scoring";
import { fromEvidenceOutput, toEvidenceOutput } from "@/lib/ai/evidence-adapter";
import type { CandidateEvidenceOutput } from "@/lib/ai/schemas/evidence";
import { stripPii } from "@/lib/parsing/pii-strip";
import { getRepositories, type CandidateEvidence, type CandidateScore } from "@/lib/repositories";
import { aggregateScore } from "@/lib/scoring/aggregate";
import { getRubric, type RoleKey } from "@/lib/rubric";
import { getEffectiveRubric } from "@/lib/rubric/effective";
import { autoGenerateEmailDraftIfNeeded } from "./generate-email-draft";

export type PipelineResult =
  | { ok: true; evidence: CandidateEvidence; score: CandidateScore }
  | { ok: false; error: string };

/** The other role's rubric — every candidate is scored against both, reusing
 * the same extracted evidence, so a strong fit for the "wrong" role is never
 * silently missed. */
const OTHER_ROLE: Record<RoleKey, RoleKey> = { pm: "spm", spm: "pm" };

async function scoreAndSave(params: {
  applicationId: string;
  role: RoleKey;
  isPrimary: boolean;
  evidenceOutput: CandidateEvidenceOutput;
}): Promise<{ ok: true; score: CandidateScore } | { ok: false; error: string }> {
  const repos = getRepositories();
  const rubric = await getEffectiveRubric(params.role);

  const scoringResult = await scoreCandidateAgainstRubric({
    role: params.role,
    evidence: params.evidenceOutput,
    rubric,
  });
  if (!scoringResult.ok) return { ok: false, error: scoringResult.error };

  const aggregate = aggregateScore({
    role: params.role,
    criteria: scoringResult.data.criteria,
    weights: Object.fromEntries(rubric.criteria.map((c) => [c.key, c.weight])),
  });
  if (!aggregate.ok) {
    return {
      ok: false,
      error: `Model returned an invalid scoring shape: ${aggregate.error}`,
    };
  }

  const score = await repos.scores.upsert(params.applicationId, params.role, {
    isPrimary: params.isPrimary,
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

/** Scores against both the application's primary role and the other role's
 * rubric, in parallel (same wall-clock as a single scoring call). Only the
 * primary result is load-bearing for the pipeline's own success/failure —
 * a secondary-score failure is logged and skipped, never blocks REVIEWED. */
async function scoreBothRoles(params: {
  applicationId: string;
  primaryRole: RoleKey;
  evidenceOutput: CandidateEvidenceOutput;
}): Promise<{ ok: true; score: CandidateScore } | { ok: false; error: string }> {
  const [primaryOutcome, secondaryOutcome] = await Promise.all([
    scoreAndSave({
      applicationId: params.applicationId,
      role: params.primaryRole,
      isPrimary: true,
      evidenceOutput: params.evidenceOutput,
    }),
    scoreAndSave({
      applicationId: params.applicationId,
      role: OTHER_ROLE[params.primaryRole],
      isPrimary: false,
      evidenceOutput: params.evidenceOutput,
    }),
  ]);

  if (!secondaryOutcome.ok) {
    console.error(
      `Secondary (${OTHER_ROLE[params.primaryRole]}) scoring failed for application ${params.applicationId}: ${secondaryOutcome.error}`,
    );
  }

  return primaryOutcome;
}

/**
 * Full pipeline for a NEW (or previously PROCESSING_FAILED) application:
 * extract evidence from the candidate's already-stored CV text, score it
 * against both role rubrics, save all of it, and auto-draft the appropriate
 * email. Shared by both the single upload route and the batch processor so
 * their behavior never diverges.
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

  // The upload-time name is only a first-line-of-resume guess (see
  // guessNameFromText); now that the AI has actually read the CV, reconcile
  // the candidate record with its verified name so the dashboard stops
  // showing e.g. a LinkedIn headline that happened to be the first line.
  const aiName = evidenceResult.data.candidate.name.trim();
  if (aiName && aiName !== candidate.name) {
    await repos.candidates.updateName(candidate.id, aiName);
  }

  const scoreOutcome = await scoreBothRoles({
    applicationId,
    primaryRole: application.roleKey,
    evidenceOutput: evidenceResult.data,
  });
  if (!scoreOutcome.ok) {
    await repos.applications.updateStatus(applicationId, "PROCESSING_FAILED", scoreOutcome.error);
    return { ok: false, error: scoreOutcome.error };
  }

  await repos.applications.updateStatus(applicationId, "REVIEWED");

  // Awaited, not fire-and-forget: a serverless upload handler can be frozen
  // the instant it returns, which would silently drop an un-awaited draft
  // call in production (the same class of bug fixed for batch processing's
  // maxDuration in an earlier commit).
  await autoGenerateEmailDraftIfNeeded({
    applicationId,
    candidate: { ...candidate, name: aiName || candidate.name },
    roleKey: application.roleKey,
    overallScore: scoreOutcome.score.overallScore,
    highlights: scoreOutcome.score.strengths,
    concerns: scoreOutcome.score.concerns,
  });

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

  const candidate = await repos.candidates.getById(application.candidateId);
  if (!candidate) return { ok: false, error: `Candidate not found for application: ${applicationId}` };

  const cachedEvidence = await repos.evidence.getByApplicationId(applicationId);
  if (!cachedEvidence) {
    return {
      ok: false,
      error: "No cached evidence for this application yet — process it first.",
    };
  }

  const scoreOutcome = await scoreBothRoles({
    applicationId,
    primaryRole: application.roleKey,
    evidenceOutput: toEvidenceOutput(cachedEvidence),
  });
  if (!scoreOutcome.ok) {
    await repos.applications.updateStatus(applicationId, "PROCESSING_FAILED", scoreOutcome.error);
    return { ok: false, error: scoreOutcome.error };
  }

  // Only drafts an email if none exists yet for this application — never
  // overwrites a draft the founder has already reviewed, edited, or sent.
  await autoGenerateEmailDraftIfNeeded({
    applicationId,
    candidate,
    roleKey: application.roleKey,
    overallScore: scoreOutcome.score.overallScore,
    highlights: scoreOutcome.score.strengths,
    concerns: scoreOutcome.score.concerns,
  });

  return { ok: true, evidence: cachedEvidence, score: scoreOutcome.score };
}
