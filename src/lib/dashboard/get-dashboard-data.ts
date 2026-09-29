import { getRepositories } from "@/lib/repositories";
import type { Application, ApplicationStatus } from "@/lib/repositories";
import { getRubric, type RoleKey } from "@/lib/rubric";

export interface DashboardCriterionCell {
  key: string;
  shortLabel: string;
  score: number | null;
}

export interface DashboardRow {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  currentRole: string | null;
  yearsExperience: number | null;
  overallScore: number | null;
  criteria: DashboardCriterionCell[];
  historicalSignalTriggered: boolean | null;
  status: ApplicationStatus;
  processingError: string | null;
}

export interface DashboardSummary {
  applications: number;
  reviewed: number;
  shortlisted: number;
  interview: number;
  rejected: number;
  averageScore: number | null;
}

export interface DashboardData {
  role: RoleKey;
  rows: DashboardRow[];
  summary: DashboardSummary;
}

// Short column labels for the dashboard table — derived from the rubric's
// own criterion names rather than a fixed 4-column layout, since PM and SPM
// have different criteria and none should be mislabeled to fit a generic
// "Domain / Ownership / Decision / Discovery" header.
function shortLabel(criterionKey: string): string {
  const labels: Record<string, string> = {
    zero_to_one_ownership: "Zero-to-One",
    logistics_domain_grounding: "Domain",
    ship_and_kill_decision_discipline: "Ship/Kill",
    direct_field_customer_discovery: "Discovery",
    stakeholder_trust_signal: "Trust",
    complex_integration_systems_ownership: "Integration",
    logistics_domain_depth: "Domain",
    consequence_bearing_decision_making: "Consequence",
    self_initiated_action_under_pressure: "Initiative",
    cross_functional_practice_building: "Practice",
    loss_institutionalized: "Loss→Process",
  };
  return labels[criterionKey] ?? criterionKey;
}

export async function getDashboardData(role: RoleKey): Promise<DashboardData> {
  const repos = getRepositories();
  const applications = await repos.applications.list({ roleKey: role });
  const rubric = getRubric(role);

  const rows: DashboardRow[] = await Promise.all(
    applications.map(async (application: Application) => {
      const [candidate, evidence, score] = await Promise.all([
        repos.candidates.getById(application.candidateId),
        repos.evidence.getByApplicationId(application.id),
        repos.scores.getByApplicationId(application.id),
      ]);

      const criteria: DashboardCriterionCell[] = rubric.criteria.map((c) => ({
        key: c.key,
        shortLabel: shortLabel(c.key),
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
        status: application.status,
        processingError: application.processingError,
      };
    }),
  );

  rows.sort((a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1));

  const scored = rows.filter((r) => r.overallScore !== null);
  const summary: DashboardSummary = {
    applications: rows.length,
    reviewed: rows.filter((r) => r.status !== "NEW" && r.status !== "PROCESSING").length,
    shortlisted: rows.filter((r) => r.status === "SHORTLISTED").length,
    interview: rows.filter((r) => r.status === "INTERVIEW").length,
    rejected: rows.filter((r) => r.status === "REJECTED").length,
    averageScore:
      scored.length > 0
        ? Math.round((scored.reduce((s, r) => s + (r.overallScore ?? 0), 0) / scored.length) * 100) / 100
        : null,
  };

  return { role, rows, summary };
}
