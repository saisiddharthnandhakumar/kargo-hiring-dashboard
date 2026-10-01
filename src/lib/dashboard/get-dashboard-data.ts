import { getRepositories } from "@/lib/repositories";
import type { Application, EmailDraft } from "@/lib/repositories";
import { AUTO_DRAFT_SCORE_THRESHOLD } from "@/lib/scoring/thresholds";
import type { RoleKey } from "@/lib/rubric";
import { firstSentence, headline, isEmailed, type DashboardRow, type DashboardSummary } from "./row";

export type { DashboardRow, DashboardSummary } from "./row";

const OTHER_ROLE: Record<RoleKey, RoleKey> = { pm: "spm", spm: "pm" };

export interface DashboardData {
  role: RoleKey;
  rows: DashboardRow[];
  summary: DashboardSummary;
}

function latestDraft(drafts: EmailDraft[]): EmailDraft | null {
  return [...drafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export async function buildDashboardRow(application: Application): Promise<DashboardRow> {
  const repos = getRepositories();
  const [candidate, evidence, allScores, drafts] = await Promise.all([
    repos.candidates.getById(application.candidateId),
    repos.evidence.getByApplicationId(application.id),
    repos.scores.getAllByApplicationId(application.id),
    repos.emails.listDraftsForApplication(application.id),
  ]);

  const score = allScores.find((s) => s.isPrimary) ?? null;
  const secondaryScore = allScores.find((s) => s.roleKey === OTHER_ROLE[application.roleKey]) ?? null;
  const crossRoleFit =
    secondaryScore && secondaryScore.overallScore >= AUTO_DRAFT_SCORE_THRESHOLD
      ? { roleKey: secondaryScore.roleKey, overallScore: secondaryScore.overallScore }
      : null;
  const draft = latestDraft(drafts);
  const passed = score ? score.overallScore >= AUTO_DRAFT_SCORE_THRESHOLD : null;
  const topConcern = score?.concerns[0];

  return {
    applicationId: application.id,
    candidateId: application.candidateId,
    candidateName: candidate?.name ?? "Unknown candidate",
    candidateEmail: candidate?.email ?? null,
    currentRole: evidence?.currentRole.value ?? null,
    yearsExperience: evidence?.yearsExperience.value ?? null,
    overallScore: score?.overallScore ?? null,
    whyLine: !score
      ? null
      : passed || !topConcern
        ? firstSentence(score.whySurfaced)
        : headline(topConcern),
    whyKind: !score ? null : passed || !topConcern ? "match" : "gap",
    historicalSignalTriggered: score?.historicalSignal.triggered ?? null,
    crossRoleFit,
    email: draft ? { type: draft.type, status: draft.status } : null,
    status: application.status,
    processingError: application.processingError,
  };
}

export async function getDashboardData(role: RoleKey): Promise<DashboardData> {
  const repos = getRepositories();
  const applications = await repos.applications.list({ roleKey: role, isCalibration: false });
  const rows = await Promise.all(applications.map(buildDashboardRow));

  rows.sort((a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1));

  const scored = rows.filter((r) => r.overallScore !== null);
  const summary: DashboardSummary = {
    applicants: rows.length,
    passed: scored.filter((r) => r.overallScore! >= AUTO_DRAFT_SCORE_THRESHOLD).length,
    notPassed: scored.filter((r) => r.overallScore! < AUTO_DRAFT_SCORE_THRESHOLD).length,
    awaitingEmail: scored.filter((r) => !isEmailed(r)).length,
    emailed: rows.filter(isEmailed).length,
  };

  return { role, rows, summary };
}
