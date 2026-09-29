import type { RoleKey } from "@/lib/rubric";
import type { CriterionResult, HistoricalSignalResult } from "@/lib/scoring/types";

export type { RoleKey };

export type ApplicationStatus =
  | "NEW"
  | "PROCESSING"
  | "REVIEWED"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "REJECTED"
  | "HIRED"
  | "PROCESSING_FAILED";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "NEW",
  "PROCESSING",
  "REVIEWED",
  "SHORTLISTED",
  "INTERVIEW",
  "REJECTED",
  "HIRED",
  "PROCESSING_FAILED",
];

export interface EvidenceSignal<T = string> {
  value: T;
  evidence: string;
  confidence: number;
  basis: "explicit" | "inferred";
}

export interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  resumeFileName: string;
  resumeFilePath: string;
  resumeMimeType: string;
  /** Full text, pre-PII-strip. Kept for the app's own use (e.g. emailing
   * the candidate later) — the AI never sees this copy, only the stripped one. */
  rawText: string;
  createdAt: string;
}

export interface Application {
  id: string;
  candidateId: string;
  roleKey: RoleKey;
  originalRoleKey: RoleKey;
  roleOverridden: boolean;
  status: ApplicationStatus;
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateEvidence {
  id: string;
  applicationId: string;
  /** The AI's own read of the candidate's name/current role — kept
   * alongside the EvidenceSignal-wrapped currentRole below purely so a
   * cached record round-trips back into the exact AI schema shape for
   * re-scoring/brief-generation without needing to re-extract from the CV. */
  candidateName: string;
  candidateCurrentRoleTitle: string;
  currentRole: EvidenceSignal;
  yearsExperience: EvidenceSignal<number>;
  companies: EvidenceSignal<string[]>;
  education: EvidenceSignal<string[]>;
  logisticsExperience: EvidenceSignal;
  productExperience: EvidenceSignal;
  technicalExperience: EvidenceSignal;
  ownershipExamples: EvidenceSignal<string[]>;
  decisionExamples: EvidenceSignal<string[]>;
  discoveryExamples: EvidenceSignal<string[]>;
  stakeholderSignals: EvidenceSignal<string[]>;
  careerTransitions: EvidenceSignal<string[]>;
  measurableOutcomes: EvidenceSignal<string[]>;
  rawEvidence: string;
  modelId: string;
  promptVersion: string;
  createdAt: string;
}

export interface CandidateScore {
  id: string;
  applicationId: string;
  overallScore: number;
  whySurfaced: string;
  criteria: CriterionResult[];
  historicalSignal: HistoricalSignalResult;
  strengths: string[];
  concerns: string[];
  interviewQuestions: string[];
  modelId: string;
  promptVersion: string;
  createdAt: string;
}

export interface InterviewBriefQuestion {
  question: string;
  probesFor: string;
  whatAGoodAnswerShows: string;
  whatWouldWeakenConfidence: string;
}

export interface InterviewBrief {
  id: string;
  applicationId: string;
  summary: string;
  whyShortlisted: string;
  strengths: string[];
  uncertainties: string[];
  questions: InterviewBriefQuestion[];
  followUpProbes: string[];
  modelId: string;
  promptVersion: string;
  createdAt: string;
}

export type EmailType = "interview_invite" | "rejection";
export type EmailDraftStatus = "draft" | "sent";

export interface EmailDraft {
  id: string;
  applicationId: string;
  type: EmailType;
  subject: string;
  body: string;
  status: EmailDraftStatus;
  modelId: string;
  promptVersion: string;
  createdAt: string;
  updatedAt: string;
}

export type EmailLogStatus = "sent" | "simulated" | "failed";

export interface EmailLog {
  id: string;
  emailDraftId: string;
  applicationId: string;
  to: string;
  subject: string;
  resendMessageId: string | null;
  status: EmailLogStatus;
  error: string | null;
  sentAt: string;
}

export type OverrideField = "status" | "roleKey" | "criterionScore";

export interface AuditLogEntry {
  id: string;
  applicationId: string;
  field: OverrideField | string;
  oldValue: string | null;
  newValue: string;
  reason: string | null;
  actor: string;
  createdAt: string;
}

export type BatchRunStatus = "idle" | "running" | "completed" | "failed";

export interface BatchRun {
  id: string;
  status: BatchRunStatus;
  totalCount: number;
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  currentApplicationId: string | null;
  failures: { applicationId: string; fileName: string; error: string }[];
  startedAt: string;
  finishedAt: string | null;
}

export interface CandidateRepository {
  create(input: Omit<Candidate, "id" | "createdAt">): Promise<Candidate>;
  getById(id: string): Promise<Candidate | null>;
  list(): Promise<Candidate[]>;
}

export interface ApplicationRepository {
  create(
    input: Omit<Application, "id" | "createdAt" | "updatedAt" | "status" | "processingError">,
  ): Promise<Application>;
  getById(id: string): Promise<Application | null>;
  list(filter?: { status?: ApplicationStatus; roleKey?: RoleKey }): Promise<Application[]>;
  listByStatuses(statuses: ApplicationStatus[]): Promise<Application[]>;
  updateStatus(
    id: string,
    status: ApplicationStatus,
    processingError?: string | null,
  ): Promise<Application>;
  overrideRole(
    id: string,
    roleKey: RoleKey,
    reason: string | null,
    actor: string,
  ): Promise<Application>;
}

export interface EvidenceRepository {
  upsert(
    applicationId: string,
    evidence: Omit<CandidateEvidence, "id" | "applicationId" | "createdAt">,
  ): Promise<CandidateEvidence>;
  getByApplicationId(applicationId: string): Promise<CandidateEvidence | null>;
}

export interface ScoreRepository {
  upsert(
    applicationId: string,
    score: Omit<CandidateScore, "id" | "applicationId" | "createdAt">,
  ): Promise<CandidateScore>;
  getByApplicationId(applicationId: string): Promise<CandidateScore | null>;
  applyCriterionOverride(
    applicationId: string,
    criterionKey: string,
    newScore: 1 | 2 | 3 | 4 | 5,
    reason: string | null,
    actor: string,
  ): Promise<CandidateScore>;
}

export interface BriefRepository {
  upsert(
    applicationId: string,
    brief: Omit<InterviewBrief, "id" | "applicationId" | "createdAt">,
  ): Promise<InterviewBrief>;
  getByApplicationId(applicationId: string): Promise<InterviewBrief | null>;
}

export interface EmailRepository {
  createDraft(
    input: Omit<EmailDraft, "id" | "createdAt" | "updatedAt" | "status">,
  ): Promise<EmailDraft>;
  updateDraft(id: string, patch: Partial<Pick<EmailDraft, "subject" | "body">>): Promise<EmailDraft>;
  getDraftById(id: string): Promise<EmailDraft | null>;
  getLatestDraft(applicationId: string, type: EmailType): Promise<EmailDraft | null>;
  listDraftsForApplication(applicationId: string): Promise<EmailDraft[]>;
  markSent(id: string): Promise<EmailDraft>;
  createLog(entry: Omit<EmailLog, "id" | "sentAt"> & { sentAt?: string }): Promise<EmailLog>;
  listLogs(applicationId: string): Promise<EmailLog[]>;
  listRecentLogs(limit?: number): Promise<EmailLog[]>;
}

export interface AuditRepository {
  append(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<AuditLogEntry>;
  listForApplication(applicationId: string): Promise<AuditLogEntry[]>;
}

export interface BatchRunRepository {
  start(totalCount: number): Promise<BatchRun>;
  update(id: string, patch: Partial<Omit<BatchRun, "id">>): Promise<BatchRun>;
  getById(id: string): Promise<BatchRun | null>;
  getLatest(): Promise<BatchRun | null>;
}

export interface Repositories {
  mode: "memory" | "supabase";
  candidates: CandidateRepository;
  applications: ApplicationRepository;
  evidence: EvidenceRepository;
  scores: ScoreRepository;
  briefs: BriefRepository;
  emails: EmailRepository;
  audit: AuditRepository;
  batchRuns: BatchRunRepository;
}
