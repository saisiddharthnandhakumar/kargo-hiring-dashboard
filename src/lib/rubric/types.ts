export type RoleKey = "pm" | "spm";

/** 4-point scale: 4=Strong, 3=Present, 2=Weak, 1=Absent. */
export interface RubricCriterionAnchors {
  4: string;
  3: string;
  2: string;
  1: string;
}

export const SCORE_LEVEL_LABELS = {
  4: "Strong",
  3: "Present",
  2: "Weak",
  1: "Absent",
} as const;

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

/** Deterministic historical-signal rule: which two criteria, both at 4/4
 * (Strong), constitute the "100% Exceeds hit rate" pattern for this role. Computed
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
