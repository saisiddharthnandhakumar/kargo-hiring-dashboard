import type { Rubric, RoleKey } from "./types";
import { PM_RUBRIC } from "./pm";
import { SPM_RUBRIC } from "./spm";

export * from "./types";
export { HISTORICAL_PATTERNS } from "./historical-patterns";
export { PM_RUBRIC } from "./pm";
export { SPM_RUBRIC } from "./spm";

const RUBRICS: Record<RoleKey, Rubric> = {
  pm: PM_RUBRIC,
  spm: SPM_RUBRIC,
};

export function getRubric(role: RoleKey): Rubric {
  return RUBRICS[role];
}

/** The calibrated default weights for a role (criterion key → fraction of 1). */
export function getDefaultWeights(role: RoleKey): Record<string, number> {
  return Object.fromEntries(getRubric(role).criteria.map((c) => [c.key, c.weight]));
}

/** The rubric with founder-edited weights laid over the calibrated defaults.
 * Pure — the weights themselves are loaded by getEffectiveRubric. */
export function withWeights(rubric: Rubric, weights: Record<string, number> | null): Rubric {
  if (!weights) return rubric;
  return {
    ...rubric,
    criteria: rubric.criteria.map((c) => ({ ...c, weight: weights[c.key] ?? c.weight })),
  };
}

export function getCriterionKeys(role: RoleKey): string[] {
  return getRubric(role).criteria.map((c) => c.key);
}

export function isValidRoleKey(value: string): value is RoleKey {
  return value === "pm" || value === "spm";
}

export const RUBRIC_VERSION = "v2-calibration-8-hires-plus-loss-institutionalized";
