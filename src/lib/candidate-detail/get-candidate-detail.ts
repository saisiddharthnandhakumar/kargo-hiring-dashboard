import { getRepositories } from "@/lib/repositories";
import type {
  Application,
  AuditLogEntry,
  Candidate,
  CandidateEvidence,
  CandidateScore,
  EmailDraft,
  EmailLog,
  InterviewBrief,
} from "@/lib/repositories";
import { type Rubric, type RoleKey } from "@/lib/rubric";
import { getEffectiveRubric } from "@/lib/rubric/effective";
import { AUTO_DRAFT_SCORE_THRESHOLD } from "@/lib/scoring/thresholds";
import { deriveHistoricalSignalChecks, type HistoricalSignalChecks } from "./historical-signals";

const OTHER_ROLE: Record<RoleKey, RoleKey> = { pm: "spm", spm: "pm" };

export interface CandidateDetailData {
  application: Application;
  candidate: Candidate;
  evidence: CandidateEvidence | null;
  score: CandidateScore | null;
  /** The candidate's score against the OTHER role's rubric, shown as an
   * "also strong fit for {role}" badge when it clears the same bar used for
   * auto-drafting an interview invite. Null if it hasn't been computed or
   * doesn't clear the bar. */
  crossRoleFit: { roleKey: RoleKey; overallScore: number } | null;
  brief: InterviewBrief | null;
  emailDrafts: EmailDraft[];
  emailLogs: EmailLog[];
  auditLog: AuditLogEntry[];
  rubric: Rubric;
  historicalChecks: HistoricalSignalChecks | null;
}

export async function getCandidateDetail(applicationId: string): Promise<CandidateDetailData | null> {
  const repos = getRepositories();

  const application = await repos.applications.getById(applicationId);
  if (!application) return null;

  const [candidate, evidence, allScores, brief, emailDrafts, emailLogs, auditLog] = await Promise.all([
    repos.candidates.getById(application.candidateId),
    repos.evidence.getByApplicationId(applicationId),
    repos.scores.getAllByApplicationId(applicationId),
    repos.briefs.getByApplicationId(applicationId),
    repos.emails.listDraftsForApplication(applicationId),
    repos.emails.listLogs(applicationId),
    repos.audit.listForApplication(applicationId),
  ]);

  if (!candidate) return null;

  const score = allScores.find((s) => s.isPrimary) ?? null;
  const secondaryScore = allScores.find((s) => s.roleKey === OTHER_ROLE[application.roleKey]) ?? null;
  const crossRoleFit =
    secondaryScore && secondaryScore.overallScore >= AUTO_DRAFT_SCORE_THRESHOLD
      ? { roleKey: secondaryScore.roleKey, overallScore: secondaryScore.overallScore }
      : null;

  const rubric = await getEffectiveRubric(application.roleKey);
  const historicalChecks =
    evidence && score ? deriveHistoricalSignalChecks(application.roleKey, score.criteria, evidence) : null;

  return {
    application,
    candidate,
    evidence,
    score,
    crossRoleFit,
    brief,
    emailDrafts,
    emailLogs,
    auditLog,
    rubric,
    historicalChecks,
  };
}
