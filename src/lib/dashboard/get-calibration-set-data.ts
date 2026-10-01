import { getRepositories } from "@/lib/repositories";
import type { Application } from "@/lib/repositories";
import { getRubric, type RoleKey } from "@/lib/rubric";
import type { DashboardCriterionCell, DashboardRow } from "./get-dashboard-data";

/** Same row shape as the live dashboard, but sourced from the 8 seeded
 * past-hire records (isCalibration: true) used to calibrate the rubric —
 * read-only reference data, kept out of the live CandidateTable/SummaryCards
 * entirely so it's never confused with a real applicant. */
export async function getCalibrationSetData(role: RoleKey): Promise<DashboardRow[]> {
  const repos = getRepositories();
  const applications = await repos.applications.list({ roleKey: role, isCalibration: true });
  const rubric = getRubric(role);

  const rows: DashboardRow[] = await Promise.all(
    applications.map(async (application: Application) => {
      const [candidate, evidence, score] = await Promise.all([
        repos.candidates.getById(application.candidateId),
        repos.evidence.getByApplicationId(application.id),
        repos.scores.getPrimaryByApplicationId(application.id),
      ]);

      const criteria: DashboardCriterionCell[] = rubric.criteria.map((c) => ({
        key: c.key,
        shortLabel: c.name,
        score: score?.criteria.find((sc) => sc.key === c.key)?.score ?? null,
      }));

      return {
        applicationId: application.id,
        candidateId: application.candidateId,
        candidateName: candidate?.name ?? "Unknown candidate",
        currentRole: evidence?.currentRole.value ?? null,
        yearsExperience: evidence?.yearsExperience.value ?? null,
        overallScore: score?.overallScore ?? null,
        criteria,
        historicalSignalTriggered: score?.historicalSignal.triggered ?? null,
        crossRoleFit: null,
        status: application.status,
        processingError: application.processingError,
      };
    }),
  );

  rows.sort((a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1));
  return rows;
}
