import type { CandidateEvidence } from "@/lib/repositories";
import type { CriterionResult } from "@/lib/scoring/types";
import type { RoleKey } from "@/lib/rubric";

export type SignalCheckStatus = "present" | "absent" | "unclear";

export interface SignalCheck {
  status: SignalCheckStatus;
  detail: string;
}

// The rubric criterion that stands in for "self-initiated action" per role
// — direct for SPM, a labeled proxy for PM (see lib/rubric/pm.ts).
const SELF_INITIATED_PROXY_CRITERION: Record<RoleKey, string> = {
  pm: "zero_to_one_ownership",
  spm: "self_initiated_action_under_pressure",
};

const DOMAIN_CRITERION: Record<RoleKey, string> = {
  pm: "logistics_domain_grounding",
  spm: "logistics_domain_depth",
};

function checkFromCriterionScore(criteria: CriterionResult[], key: string): SignalCheck {
  const criterion = criteria.find((c) => c.key === key);
  if (!criterion) return { status: "unclear", detail: "Criterion not found." };
  if (criterion.score >= 4) return { status: "present", detail: criterion.rationale };
  if (criterion.score <= 2) return { status: "absent", detail: criterion.rationale };
  return { status: "unclear", detail: criterion.rationale };
}

function checkCareerTransitions(evidence: CandidateEvidence): SignalCheck {
  const signal = evidence.careerTransitions;
  const hasTransitions = Array.isArray(signal.value) && signal.value.length > 0;
  const looksAbsent =
    !hasTransitions ||
    signal.evidence.trim().toLowerCase() === "not found in cv" ||
    signal.value.every((v) => v.trim().toLowerCase() === "not found in cv");

  if (looksAbsent) {
    return { status: "absent", detail: "No non-linear career pivot found in the CV." };
  }
  if (signal.basis === "inferred" || signal.confidence < 0.6) {
    return { status: "unclear", detail: signal.evidence };
  }
  return { status: "present", detail: signal.value.join("; ") };
}

export interface HistoricalSignalChecks {
  domainGrounding: SignalCheck;
  selfInitiatedAction: SignalCheck;
  nonLinearCareer: SignalCheck;
}

/**
 * Three qualitative, evidence-grounded checks for the "historical signals"
 * panel (Screen 2). These are directional/explanatory only — the single
 * deterministic "historical high-signal pattern" flag (both mapped criteria
 * at exactly 5/5) is computed separately in lib/scoring/aggregate.ts and is
 * what actually drives the ★ flag elsewhere in the UI.
 */
export function deriveHistoricalSignalChecks(
  role: RoleKey,
  criteria: CriterionResult[],
  evidence: CandidateEvidence,
): HistoricalSignalChecks {
  return {
    domainGrounding: checkFromCriterionScore(criteria, DOMAIN_CRITERION[role]),
    selfInitiatedAction: checkFromCriterionScore(criteria, SELF_INITIATED_PROXY_CRITERION[role]),
    nonLinearCareer: checkCareerTransitions(evidence),
  };
}
