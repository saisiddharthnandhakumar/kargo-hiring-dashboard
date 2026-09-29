import { getRubric } from "@/lib/rubric";
import type { AggregateInput, AggregateResult, CriterionResult } from "./types";

/**
 * Deterministic scoring aggregation. This is the ONLY place overallScore and
 * the historical high-signal flag are computed — never the LLM. The LLM's
 * output is treated purely as per-criterion judgment input (score 1-5 +
 * evidence); everything below is plain arithmetic and lookups against the
 * versioned rubric in lib/rubric.
 *
 * Returns a discriminated result rather than throwing: an invalid or
 * incomplete set of criterion scores (wrong/missing/duplicate keys,
 * out-of-range scores) is a data problem the caller must route to
 * PROCESSING_FAILED, not a bug to crash on.
 */
export function aggregateScore(input: AggregateInput): AggregateResult {
  const rubric = getRubric(input.role);
  const expectedKeys = rubric.criteria.map((c) => c.key);

  const seen = new Set<string>();
  for (const c of input.criteria) {
    if (seen.has(c.key)) {
      return { ok: false, error: `Duplicate criterion key in scoring output: "${c.key}"` };
    }
    seen.add(c.key);
  }

  const missingKeys = expectedKeys.filter((k) => !seen.has(k));
  if (missingKeys.length > 0) {
    return {
      ok: false,
      error: `Scoring output is missing required criteria: ${missingKeys.join(", ")}`,
    };
  }

  const extraKeys = [...seen].filter((k) => !expectedKeys.includes(k));
  if (extraKeys.length > 0) {
    return {
      ok: false,
      error: `Scoring output contains unknown criteria not in the ${input.role.toUpperCase()} rubric: ${extraKeys.join(", ")}`,
    };
  }

  const criteria: CriterionResult[] = [];
  for (const criterionInput of input.criteria) {
    const definition = rubric.criteria.find((c) => c.key === criterionInput.key);
    if (!definition) {
      // Unreachable given the extraKeys check above, but keeps this function
      // safe to call directly without relying on that check running first.
      return { ok: false, error: `Unknown criterion key: "${criterionInput.key}"` };
    }

    if (!Number.isInteger(criterionInput.score) || criterionInput.score < 1 || criterionInput.score > 5) {
      return {
        ok: false,
        error: `Criterion "${criterionInput.key}" has an invalid score (${criterionInput.score}); must be an integer 1-5`,
      };
    }

    const weightedScore = round2(criterionInput.score * definition.weight);

    criteria.push({
      ...criterionInput,
      name: definition.name,
      weight: definition.weight,
      weightedScore,
    });
  }

  const overallScoreRaw = criteria.reduce((sum, c) => sum + c.weightedScore, 0);
  const overallScore = clamp(round2(overallScoreRaw), 1, 5);

  const rule = rubric.historicalSignalRule;
  const [keyA, keyB] = rule.criteriaKeys;
  const scoreA = criteria.find((c) => c.key === keyA)?.score;
  const scoreB = criteria.find((c) => c.key === keyB)?.score;
  const triggered = scoreA === 5 && scoreB === 5;

  return {
    ok: true,
    role: input.role,
    overallScore,
    criteria,
    historicalSignal: {
      key: rule.key,
      label: rule.label,
      isProxy: rule.isProxy,
      proxyExplanation: rule.proxyExplanation,
      triggered,
      criteriaInvolved: rule.criteriaKeys,
    },
  };
}

/** Exported so any other code path that must recompute a weighted score
 * (e.g. a founder criterion-score override) uses the exact same rounding
 * rule as the initial aggregation, rather than a second hand-rolled copy. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
