import type {
  Application,
  AuditLogEntry,
  BatchRun,
  Candidate,
  CandidateEvidence,
  CandidateScore,
  EmailDraft,
  EmailLog,
  InterviewBrief,
} from "../types";

// snake_case DB row -> camelCase domain type. `pg` already parses jsonb
// columns into plain JS values, so those fields need no extra decoding.

export function candidateFromRow(row: Record<string, unknown>): Candidate {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    resumeFileName: row.resume_file_name as string,
    resumeFilePath: row.resume_file_path as string,
    resumeMimeType: row.resume_mime_type as string,
    rawText: row.raw_text as string,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export function applicationFromRow(row: Record<string, unknown>): Application {
  return {
    id: row.id as string,
    candidateId: row.candidate_id as string,
    roleKey: row.role_key as Application["roleKey"],
    originalRoleKey: row.original_role_key as Application["originalRoleKey"],
    roleOverridden: row.role_overridden as boolean,
    status: row.status as Application["status"],
    processingError: (row.processing_error as string | null) ?? null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export function evidenceFromRow(row: Record<string, unknown>): CandidateEvidence {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    candidateName: row.candidate_name as string,
    candidateCurrentRoleTitle: row.candidate_current_role_title as string,
    currentRole: row.current_role_evidence as CandidateEvidence["currentRole"],
    yearsExperience: row.years_experience as CandidateEvidence["yearsExperience"],
    companies: row.companies as CandidateEvidence["companies"],
    education: row.education as CandidateEvidence["education"],
    logisticsExperience: row.logistics_experience as CandidateEvidence["logisticsExperience"],
    productExperience: row.product_experience as CandidateEvidence["productExperience"],
    technicalExperience: row.technical_experience as CandidateEvidence["technicalExperience"],
    ownershipExamples: row.ownership_examples as CandidateEvidence["ownershipExamples"],
    decisionExamples: row.decision_examples as CandidateEvidence["decisionExamples"],
    discoveryExamples: row.discovery_examples as CandidateEvidence["discoveryExamples"],
    stakeholderSignals: row.stakeholder_signals as CandidateEvidence["stakeholderSignals"],
    careerTransitions: row.career_transitions as CandidateEvidence["careerTransitions"],
    measurableOutcomes: row.measurable_outcomes as CandidateEvidence["measurableOutcomes"],
    rawEvidence: row.raw_evidence as string,
    modelId: row.model_id as string,
    promptVersion: row.prompt_version as string,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export function scoreFromRow(row: Record<string, unknown>): CandidateScore {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    overallScore: Number(row.overall_score),
    whySurfaced: row.why_surfaced as string,
    criteria: row.criteria as CandidateScore["criteria"],
    historicalSignal: row.historical_signal as CandidateScore["historicalSignal"],
    strengths: row.strengths as string[],
    concerns: row.concerns as string[],
    interviewQuestions: row.interview_questions as string[],
    modelId: row.model_id as string,
    promptVersion: row.prompt_version as string,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export function briefFromRow(row: Record<string, unknown>): InterviewBrief {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    summary: row.summary as string,
    whyShortlisted: row.why_shortlisted as string,
    strengths: row.strengths as string[],
    uncertainties: row.uncertainties as string[],
    questions: row.questions as InterviewBrief["questions"],
    followUpProbes: row.follow_up_probes as string[],
    modelId: row.model_id as string,
    promptVersion: row.prompt_version as string,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export function emailDraftFromRow(row: Record<string, unknown>): EmailDraft {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    type: row.type as EmailDraft["type"],
    subject: row.subject as string,
    body: row.body as string,
    status: row.status as EmailDraft["status"],
    modelId: row.model_id as string,
    promptVersion: row.prompt_version as string,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export function emailLogFromRow(row: Record<string, unknown>): EmailLog {
  return {
    id: row.id as string,
    emailDraftId: row.email_draft_id as string,
    applicationId: row.application_id as string,
    to: row.to_address as string,
    subject: row.subject as string,
    resendMessageId: (row.resend_message_id as string | null) ?? null,
    status: row.status as EmailLog["status"],
    error: (row.error as string | null) ?? null,
    sentAt: (row.sent_at as Date).toISOString(),
  };
}

export function auditFromRow(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    field: row.field as string,
    oldValue: (row.old_value as string | null) ?? null,
    newValue: row.new_value as string,
    reason: (row.reason as string | null) ?? null,
    actor: row.actor as string,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export function batchRunFromRow(row: Record<string, unknown>): BatchRun {
  return {
    id: row.id as string,
    status: row.status as BatchRun["status"],
    totalCount: row.total_count as number,
    processedCount: row.processed_count as number,
    succeededCount: row.succeeded_count as number,
    failedCount: row.failed_count as number,
    currentApplicationId: (row.current_application_id as string | null) ?? null,
    failures: row.failures as BatchRun["failures"],
    startedAt: (row.started_at as Date).toISOString(),
    finishedAt: row.finished_at ? (row.finished_at as Date).toISOString() : null,
  };
}
