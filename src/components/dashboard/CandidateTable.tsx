import Link from "next/link";
import { CrossRoleFitBadge } from "@/components/candidate/CrossRoleFitBadge";
import { ScoreCell } from "@/components/ui/ScoreCell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import type { DashboardRow } from "@/lib/dashboard/get-dashboard-data";

export function CandidateTable({ rows, readOnly = false }: { rows: DashboardRow[]; readOnly?: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
        <p className="text-sm text-muted">
          No applications yet for this role. Upload a CV or run batch processing to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-muted">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Verdict</th>
            <th className="px-3 py-2 font-medium">Candidate</th>
            <th className="px-3 py-2 text-right font-medium">Overall</th>
            <th className="px-3 py-2 font-medium">Current role</th>
            <th className="px-3 py-2 font-medium">Experience</th>
            <th className="px-3 py-2 font-medium">Signal</th>
            {!readOnly && <th className="px-3 py-2 font-medium">Status</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.applicationId}
              className="border-b border-border last:border-0 hover:bg-surface-hover"
            >
              <td className="px-3 py-2.5 font-mono text-xs text-muted-2">{index + 1}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <VerdictBadge overallScore={row.overallScore} />
              </td>
              <td className="px-3 py-2.5">
                <Link
                  href={`/candidates/${row.applicationId}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {row.candidateName}
                </Link>
                {row.processingError && (
                  <div className="mt-0.5 text-xs text-score-low">{row.processingError}</div>
                )}
              </td>
              <td className="px-3 py-2.5 text-right">
                <ScoreCell score={row.overallScore} bold />
              </td>
              <td className="px-3 py-2.5 text-muted">{row.currentRole ?? "—"}</td>
              <td className="px-3 py-2.5 text-muted">
                {row.yearsExperience !== null ? `${row.yearsExperience} yrs` : "—"}
              </td>
              <td className="px-3 py-2.5">
                <span className="inline-flex items-center gap-2">
                  {row.historicalSignalTriggered ? (
                    <span
                      className="font-mono text-xs text-accent"
                      title="Historical high-signal pattern"
                      aria-label="Historical high-signal pattern matched"
                    >
                      ★
                    </span>
                  ) : (
                    <span className="text-muted-2" aria-hidden="true">
                      —
                    </span>
                  )}
                  {row.crossRoleFit && <CrossRoleFitBadge fit={row.crossRoleFit} />}
                </span>
              </td>
              {!readOnly && (
                <td className="px-3 py-2.5">
                  <StatusBadge status={row.status} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
