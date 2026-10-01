import type { RoleKey } from "@/lib/rubric";

/** What the LLM is allowed to produce for a single criterion — bounded to
 * judgment (score + evidence), never math. */
export interface CriterionScoreInput {
  key: string;
  score: number;
  rationale: string;
  evidenceRefs: string[];
  confidence: number;
  missingEvidence: string | null;
}

export interface AggregateInput {
  role: RoleKey;
  criteria: CriterionScoreInput[];
  /** Founder-edited weights (criterion key → fraction of 1). Any key not
   * present falls back to the calibrated rubric default. */
  weights?: Record<string, number>;
}

/** A criterion result after deterministic aggregation — weight and
 * weightedScore are computed here, never trusted from the model. */
export interface CriterionResult extends CriterionScoreInput {
  name: string;
  weight: number;
  weightedScore: number;
}

export interface HistoricalSignalResult {
  key: string;
  label: string;
  isProxy: boolean;
  proxyExplanation?: string;
  triggered: boolean;
  criteriaInvolved: string[];
}

export type AggregateResult =
  | {
      ok: true;
      role: RoleKey;
      overallScore: number;
      criteria: CriterionResult[];
      historicalSignal: HistoricalSignalResult;
    }
  | { ok: false; error: string };
