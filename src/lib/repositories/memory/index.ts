import type { Repositories } from "../types";
import { createMemoryApplicationRepository } from "./application-repository";
import { createMemoryAuditRepository } from "./audit-repository";
import { createMemoryBatchRunRepository } from "./batch-run-repository";
import { createMemoryBriefRepository } from "./brief-repository";
import { createMemoryCandidateRepository } from "./candidate-repository";
import { createMemoryEmailRepository } from "./email-repository";
import { createMemoryEvidenceRepository } from "./evidence-repository";
import { createMemoryScoreRepository } from "./score-repository";

export function buildMemoryRepositories(): Repositories {
  return {
    mode: "memory",
    candidates: createMemoryCandidateRepository(),
    applications: createMemoryApplicationRepository(),
    evidence: createMemoryEvidenceRepository(),
    scores: createMemoryScoreRepository(),
    briefs: createMemoryBriefRepository(),
    emails: createMemoryEmailRepository(),
    audit: createMemoryAuditRepository(),
    batchRuns: createMemoryBatchRunRepository(),
  };
}
