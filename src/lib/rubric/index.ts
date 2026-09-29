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

export function getCriterionKeys(role: RoleKey): string[] {
  return getRubric(role).criteria.map((c) => c.key);
}

export function isValidRoleKey(value: string): value is RoleKey {
  return value === "pm" || value === "spm";
}

export const RUBRIC_VERSION = "v1-calibration-8-hires";
