import type { Repositories } from "../types";
import { createNeonApplicationRepository } from "./application-repository";
import { createNeonAuditRepository } from "./audit-repository";
import { createNeonBatchRunRepository } from "./batch-run-repository";
import { createNeonBriefRepository } from "./brief-repository";
import { createNeonCandidateRepository } from "./candidate-repository";
import { createNeonEmailRepository } from "./email-repository";
import { createNeonEvidenceRepository } from "./evidence-repository";
import { createNeonRubricWeightRepository } from "./rubric-weight-repository";
import { createNeonScoreRepository } from "./score-repository";

export function buildNeonRepositories(): Repositories {
  return {
    mode: "neon",
    candidates: createNeonCandidateRepository(),
    applications: createNeonApplicationRepository(),
    evidence: createNeonEvidenceRepository(),
    scores: createNeonScoreRepository(),
    briefs: createNeonBriefRepository(),
    emails: createNeonEmailRepository(),
    audit: createNeonAuditRepository(),
    batchRuns: createNeonBatchRunRepository(),
    rubricWeights: createNeonRubricWeightRepository(),
  };
}
