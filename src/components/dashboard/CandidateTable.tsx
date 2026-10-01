"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Mail, X as XIcon } from "lucide-react";
import { CrossRoleFitBadge } from "@/components/candidate/CrossRoleFitBadge";
import { EmailDraftModal } from "@/components/dashboard/EmailDraftModal";
import { isEmailed, type DashboardRow } from "@/lib/dashboard/row";
import type { EmailType } from "@/lib/repositories/types";
import { AUTO_DRAFT_SCORE_THRESHOLD } from "@/lib/scoring/thresholds";

function VerdictPill({ score, failed }: { score: number | null; failed: boolean }) {
  if (failed) {
    return (
      <span className="inline-flex items-center rounded-full border border-score-low/40 px-2.5 py-1 text-xs font-medium text-score-low">
        Processing failed
      </span>
    );
  }
  if (score === null) {
    return <span className="text-xs text-muted-2">Scoring…</span>;
  }
  const passed = score >= AUTO_DRAFT_SCORE_THRESHOLD;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        passed ? "bg-score-high/15 text-score-high" : "bg-score-low/15 text-score-low"
      }`}
    >
      {passed ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {passed ? "Passed" : "Not passed"}
    </span>
  );
}

function EmailAction({ row, onOpen }: { row: DashboardRow; onOpen: (type: EmailType) => void }) {
  if (row.overallScore === null) return <span className="text-xs text-muted-2">—</span>;

  const passed = row.overallScore >= AUTO_DRAFT_SCORE_THRESHOLD;
  const sentType: EmailType | null = isEmailed(row)
    ? row.email?.status === "sent"
      ? row.email.type
      : row.status === "INTERVIEW"
        ? "interview_invite"
        : "rejection"
    : null;

  if (sentType) {
    return (
      <button
        type="button"
        onClick={() => onOpen(sentType)}
        className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        <Check className="h-3.5 w-3.5 text-score-high" aria-hidden="true" />
        {sentType === "interview_invite" ? "Invite sent" : "Rejection sent"}
      </button>
    );
  }

  // Follows the current verdict, not an older draft: re-weighting the rubric
  // can flip a candidate across the pass line after a draft was written.
  const type: EmailType = passed ? "interview_invite" : "rejection";
  const label = type === "interview_invite" ? "Draft invite" : "Draft rejection";

  return (
    <button
      type="button"
      onClick={() => onOpen(type)}
      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
        type === "interview_invite"
          ? "bg-accent text-accent-foreground hover:opacity-90"
          : "border border-border-strong text-foreground hover:bg-surface-hover"
      }`}
    >
      <Mail className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

export function CandidateTable({ rows, readOnly = false }: { rows: DashboardRow[]; readOnly?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState<{ row: DashboardRow; type: EmailType } | null>(null);

  // The whole row opens the candidate — except clicks on its own buttons and
  // links (email actions, badges), and drags that were selecting text.
  function openRow(event: MouseEvent<HTMLTableRowElement>, applicationId: string) {
    if ((event.target as HTMLElement).closest("a, button, input, textarea, select, [role='button']")) return;
    if (window.getSelection()?.toString()) return;
    const href = `/candidates/${applicationId}`;
    if (event.metaKey || event.ctrlKey) {
      window.open(href, "_blank", "noopener");
    } else {
      router.push(href);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong px-6 py-14 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg text-foreground">No candidates yet.</p>
        <p className="mt-1 text-sm text-muted">
          {readOnly ? "Nothing here for this role." : "Add a CV above — it's ranked in under a minute."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th scope="col" className="w-10 px-4 py-2.5 font-medium">#</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Candidate</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Score</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Verdict</th>
              {!readOnly && (
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Next step
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.applicationId}
                onClick={(e) => openRow(e, row.applicationId)}
                onMouseEnter={() => router.prefetch(`/candidates/${row.applicationId}`)}
                className="group cursor-pointer border-b border-border align-top transition-colors last:border-0 hover:bg-surface-hover/60"
              >
                <td className="px-4 py-4 font-mono text-xs text-muted-2">{index + 1}</td>
                <td className="min-w-[18rem] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/candidates/${row.applicationId}`}
                      className="text-[15px] font-semibold text-foreground underline-offset-4 group-hover:underline"
                    >
                      {row.candidateName}
                    </Link>
                    {row.historicalSignalTriggered && (
                      <span
                        className="font-mono text-xs text-accent"
                        title="Matches the pattern of your strongest past hires"
                        aria-label="Matches the pattern of your strongest past hires"
                      >
                        ★
                      </span>
                    )}
                    {row.crossRoleFit && <CrossRoleFitBadge fit={row.crossRoleFit} />}
                  </div>
                  {(row.currentRole || row.yearsExperience !== null) && (
                    <Link
                      href={`/candidates/${row.applicationId}`}
                      className="mt-0.5 block text-xs text-muted hover:text-foreground"
                    >
                      {[row.currentRole, row.yearsExperience !== null ? `${row.yearsExperience} yrs` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </Link>
                  )}
                  {row.whyLine && (
                    <p className="mt-1.5 line-clamp-2 max-w-2xl text-[13px] leading-snug text-foreground/75">
                      <span
                        className={`mr-1.5 font-medium ${
                          row.whyKind === "gap" ? "text-score-low" : "text-score-high"
                        }`}
                      >
                        {row.whyKind === "gap" ? "Gap:" : "Why:"}
                      </span>
                      {row.whyLine}
                    </p>
                  )}
                  {row.processingError && <p className="mt-1 text-xs text-score-low">{row.processingError}</p>}
                </td>
                <td className="px-4 py-4 text-right font-mono tabular-nums whitespace-nowrap">
                  {row.overallScore !== null ? (
                    <>
                      <span className="text-base font-semibold text-foreground">{row.overallScore.toFixed(2)}</span>
                      <span className="text-xs text-muted-2">/4</span>
                    </>
                  ) : (
                    <span className="text-muted-2">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <VerdictPill score={row.overallScore} failed={row.status === "PROCESSING_FAILED"} />
                </td>
                {!readOnly && (
                  <td className="px-4 py-4 text-right">
                    <EmailAction row={row} onOpen={(type) => setOpen({ row, type })} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <EmailDraftModal
          key={`${open.row.applicationId}-${open.type}`}
          applicationId={open.row.applicationId}
          candidateName={open.row.candidateName}
          candidateEmail={open.row.candidateEmail}
          initialType={open.type}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
