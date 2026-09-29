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
import { getRubric, type Rubric } from "@/lib/rubric";
import { deriveHistoricalSignalChecks, type HistoricalSignalChecks } from "./historical-signals";

export interface CandidateDetailData {
  application: Application;
  candidate: Candidate;
  evidence: CandidateEvidence | null;
  score: CandidateScore | null;
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

  const [candidate, evidence, score, brief, emailDrafts, emailLogs, auditLog] = await Promise.all([
    repos.candidates.getById(application.candidateId),
    repos.evidence.getByApplicationId(applicationId),
    repos.scores.getByApplicationId(applicationId),
    repos.briefs.getByApplicationId(applicationId),
    repos.emails.listDraftsForApplication(applicationId),
    repos.emails.listLogs(applicationId),
    repos.audit.listForApplication(applicationId),
  ]);

  if (!candidate) return null;

  const rubric = getRubric(application.roleKey);
  const historicalChecks =
    evidence && score ? deriveHistoricalSignalChecks(application.roleKey, score.criteria, evidence) : null;

  return {
    application,
    candidate,
    evidence,
    score,
    brief,
    emailDrafts,
    emailLogs,
    auditLog,
    rubric,
    historicalChecks,
  };
}
