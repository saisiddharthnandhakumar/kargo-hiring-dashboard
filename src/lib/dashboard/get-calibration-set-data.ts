import { getRepositories } from "@/lib/repositories";
import type { RoleKey } from "@/lib/rubric";
import { buildDashboardRow, type DashboardRow } from "./get-dashboard-data";

/** Same row shape as the live dashboard, but sourced from the 8 past-hire
 * records (isCalibration: true) used to calibrate the rubric — read-only
 * reference data, kept out of the live shortlist entirely. */
export async function getCalibrationSetData(role: RoleKey): Promise<DashboardRow[]> {
  const repos = getRepositories();
  const applications = await repos.applications.list({ roleKey: role, isCalibration: true });
  const rows = await Promise.all(applications.map(buildDashboardRow));
  rows.sort((a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1));
  return rows;
}
