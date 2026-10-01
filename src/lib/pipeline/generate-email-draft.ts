import { draftCandidateEmail, EMAIL_DRAFT_PROMPT_VERSION } from "@/lib/ai/email-draft";
import { COMPANY_NAME, getSenderConfig } from "@/lib/email/config";
import { getRepositories, type Candidate, type EmailDraft, type EmailType } from "@/lib/repositories";
import { getRubric, type RoleKey } from "@/lib/rubric";
import { AUTO_DRAFT_SCORE_THRESHOLD } from "@/lib/scoring/thresholds";

export { AUTO_DRAFT_SCORE_THRESHOLD };

export type DraftOutcome = { ok: true; draft: EmailDraft } | { ok: false; error: string };

/**
 * Generates and persists an email draft for a candidate. Shared by the
 * on-demand "/email" route (founder clicks Draft) and the pipeline's
 * auto-draft step after scoring, so the two paths never diverge.
 */
export async function generateEmailDraft(params: {
  applicationId: string;
  type: EmailType;
  candidate: Candidate;
  roleKey: RoleKey;
  highlights: string[];
  concerns: string[];
}): Promise<DraftOutcome> {
  const repos = getRepositories();
  const { senderName } = getSenderConfig();

  const result = await draftCandidateEmail({
    type: params.type,
    candidateName: params.candidate.name,
    roleTitle: getRubric(params.roleKey).roleTitle,
    senderName,
    companyName: COMPANY_NAME,
    highlights: params.highlights,
    concerns: params.concerns,
  });

  if (!result.ok) return { ok: false, error: result.error };

  const draft = await repos.emails.createDraft({
    applicationId: params.applicationId,
    type: params.type,
    subject: result.data.subject,
    body: result.data.body,
    modelId: result.modelId,
    promptVersion: EMAIL_DRAFT_PROMPT_VERSION,
  });

  return { ok: true, draft };
}

/**
 * Auto-drafts the right email right after scoring: an interview invite if
 * the score clears the bar, a rejection if not. Never overwrites a draft
 * the founder may already have (manually generated, edited, or sent) — this
 * only ever fires once, immediately after an application first reaches
 * REVIEWED, but rescoring also goes through it and must stay a no-op once a
 * draft exists.
 */
export async function autoGenerateEmailDraftIfNeeded(params: {
  applicationId: string;
  candidate: Candidate;
  roleKey: RoleKey;
  overallScore: number;
  highlights: string[];
  concerns: string[];
}): Promise<void> {
  const repos = getRepositories();

  const existingDrafts = await repos.emails.listDraftsForApplication(params.applicationId);
  if (existingDrafts.length > 0) return;

  const type: EmailType =
    params.overallScore >= AUTO_DRAFT_SCORE_THRESHOLD ? "interview_invite" : "rejection";

  const result = await generateEmailDraft({
    applicationId: params.applicationId,
    type,
    candidate: params.candidate,
    roleKey: params.roleKey,
    highlights: params.highlights,
    concerns: params.concerns,
  });

  if (!result.ok) {
    console.error(`Auto email draft failed for application ${params.applicationId}: ${result.error}`);
  }
}
