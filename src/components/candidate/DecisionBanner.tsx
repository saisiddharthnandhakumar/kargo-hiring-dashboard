"use client";

import { useState } from "react";
import { CrossRoleFitBadge } from "@/components/candidate/CrossRoleFitBadge";
import { EmailComposer } from "@/components/candidate/EmailComposer";
import { OverridePanel } from "@/components/candidate/OverridePanel";
import { ScoreCell } from "@/components/ui/ScoreCell";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import type { ApplicationStatus, EmailDraft, EmailLog } from "@/lib/repositories/types";
import type { RoleKey } from "@/lib/rubric";

/**
 * Above-the-fold decision summary: the AI's verdict, its one-line
 * explanation, and the auto-drafted, ready-to-send email — everything a
 * founder needs to act on a candidate in one glance, without scrolling past
 * score breakdowns and raw evidence first. "Disagree?" collapses the
 * founder's override controls right here, next to the decision they
 * contradict.
 */
export function DecisionBanner({
  applicationId,
  overallScore,
  whySurfaced,
  historicalSignalTriggered,
  crossRoleFit,
  candidateEmail,
  initialDrafts,
  initialLogs,
  status,
  roleKey,
  hasScore,
}: {
  applicationId: string;
  overallScore: number;
  whySurfaced: string;
  historicalSignalTriggered: boolean;
  crossRoleFit: { roleKey: RoleKey; overallScore: number } | null;
  candidateEmail: string | null;
  initialDrafts: EmailDraft[];
  initialLogs: EmailLog[];
  status: ApplicationStatus;
  roleKey: RoleKey;
  hasScore: boolean;
}) {
  const [disagreeOpen, setDisagreeOpen] = useState(false);

  return (
    <section className="rounded-lg border border-border-strong bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <VerdictBadge overallScore={overallScore} size="lg" />
          <ScoreCell score={overallScore} bold />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {historicalSignalTriggered && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent"
              title="Historical high-signal pattern"
            >
              ★ Historical high-signal pattern
            </span>
          )}
          {crossRoleFit && <CrossRoleFitBadge fit={crossRoleFit} variant="full" />}
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground">{whySurfaced}</p>

      <div className="mt-4 rounded-md border border-border bg-background p-3">
        <EmailComposer
          applicationId={applicationId}
          candidateEmail={candidateEmail}
          initialDrafts={initialDrafts}
          initialLogs={initialLogs}
          compact
        />
      </div>

      <button
        type="button"
        aria-expanded={disagreeOpen}
        onClick={() => setDisagreeOpen((v) => !v)}
        className="mt-4 cursor-pointer text-xs font-medium text-muted underline underline-offset-4 hover:text-foreground"
      >
        {disagreeOpen ? "Hide founder controls" : "Disagree with this verdict?"}
      </button>

      {disagreeOpen && (
        <div className="mt-3">
          <OverridePanel
            applicationId={applicationId}
            status={status}
            roleKey={roleKey}
            hasScore={hasScore}
          />
        </div>
      )}
    </section>
  );
}
