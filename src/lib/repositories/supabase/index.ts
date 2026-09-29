import type { Repositories } from "../types";
import { createSupabaseApplicationRepository } from "./application-repository";
import { createSupabaseAuditRepository } from "./audit-repository";
import { createSupabaseBatchRunRepository } from "./batch-run-repository";
import { createSupabaseBriefRepository } from "./brief-repository";
import { createSupabaseCandidateRepository } from "./candidate-repository";
import { createSupabaseEmailRepository } from "./email-repository";
import { createSupabaseEvidenceRepository } from "./evidence-repository";
import { createSupabaseScoreRepository } from "./score-repository";

export function buildSupabaseRepositories(): Repositories {
  return {
    mode: "supabase",
    candidates: createSupabaseCandidateRepository(),
    applications: createSupabaseApplicationRepository(),
    evidence: createSupabaseEvidenceRepository(),
    scores: createSupabaseScoreRepository(),
    briefs: createSupabaseBriefRepository(),
    emails: createSupabaseEmailRepository(),
    audit: createSupabaseAuditRepository(),
    batchRuns: createSupabaseBatchRunRepository(),
  };
}
