// Client-safe: no repository/AI imports, so client components can use these
// without pulling the Postgres driver into the browser bundle.
import type { ApplicationStatus, EmailDraft, EmailType } from "@/lib/repositories/types";
import type { RoleKey } from "@/lib/rubric/types";

export interface DashboardEmailState {
  type: EmailType;
  status: EmailDraft["status"];
}

export interface DashboardRow {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string | null;
  currentRole: string | null;
  yearsExperience: number | null;
  overallScore: number | null;
  /** One line: why they match (passed) or their biggest gap (not passed). */
  whyLine: string | null;
  whyKind: "match" | "gap" | null;
  historicalSignalTriggered: boolean | null;
  crossRoleFit: { roleKey: RoleKey; overallScore: number } | null;
  /** Latest email draft for this application, if any. */
  email: DashboardEmailState | null;
  status: ApplicationStatus;
  processingError: string | null;
}

export interface DashboardSummary {
  applicants: number;
  passed: number;
  notPassed: number;
  awaitingEmail: number;
  emailed: number;
}

export function isEmailed(row: Pick<DashboardRow, "email" | "status">): boolean {
  return row.email?.status === "sent" || row.status === "INTERVIEW" || row.status === "REJECTED";
}

/** First sentence of the AI's explanation — the dashboard only has room for one line. */
export function firstSentence(text: string): string {
  const match = text.trim().match(/^.+?[.!?](?=\s|$)/);
  return (match ? match[0] : text).trim();
}

/** Headline of a concern: the part before its elaboration ("No PM experience: has only…"). */
export function headline(text: string): string {
  const cut = text.search(/[:;]\s/);
  return cut >= 20 ? text.slice(0, cut).trim() : firstSentence(text);
}
