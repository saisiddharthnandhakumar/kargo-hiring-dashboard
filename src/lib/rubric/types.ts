export type RoleKey = "pm" | "spm";

export interface RubricCriterionAnchors {
  /** What a score of 5/5 looks like, verbatim from the calibrated rubric. */
  5: string;
  /** What a score of 3/5 looks like, verbatim from the calibrated rubric. */
  3: string;
  /** What a score of 1/5 looks like, verbatim from the calibrated rubric. */
  1: string;
}

export interface RubricCriterion {
  /** Stable machine key. Used to match LLM output to this criterion and in
   * the deterministic historical-signal detection in lib/scoring/aggregate.ts. */
  key: string;
  name: string;
  /** Weight as a fraction of 1 (e.g. 0.25 for 25%). Weights for a role sum to 1. */
  weight: number;
  description: string;
  anchors: RubricCriterionAnchors;
  redFlag?: string;
  /** Extra guidance the scoring prompt must include verbatim (notes/caveats
   * from the rubric that aren't part of the anchor text itself). */
  note?: string;
}

export interface HistoricalPattern {
  key: string;
  title: string;
  description: string;
  whyJdsMissIt: string;
}

/** Deterministic historical-signal rule: which two criteria, both at 5/5,
 * constitute the "100% Exceeds hit rate" pattern for this role. Computed
 * only in lib/scoring/aggregate.ts — never asserted by the LLM. */
export interface HistoricalSignalRule {
  key: string;
  label: string;
  /** True for PM, where "Self-Initiated Action" has no literal criterion and
   * is mapped to the closest applicable one (Zero-to-One Ownership). */
  isProxy: boolean;
  proxyExplanation?: string;
  criteriaKeys: [string, string];
}

export interface Rubric {
  role: RoleKey;
  roleTitle: string;
  totalWeightLabel: string;
  criteria: RubricCriterion[];
  historicalSignalRule: HistoricalSignalRule;
}
