"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import type { CriterionResult, HistoricalSignalResult } from "@/lib/scoring/types";

export function ScoreBreakdown({
  applicationId,
  criteria,
  historicalSignal,
}: {
  applicationId: string;
  criteria: CriterionResult[];
  historicalSignal: HistoricalSignalResult;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
        Rubric scorecard
      </h2>
      <div className="flex flex-col gap-3">
        {criteria.map((c) => (
          <CriterionCard key={c.key} applicationId={applicationId} criterion={c} />
        ))}
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          historicalSignal.triggered
            ? "border-accent/40 bg-accent/10 text-foreground"
            : "border-border text-muted"
        }`}
      >
        <span className="font-medium">
          {historicalSignal.triggered ? "★ " : ""}
          {historicalSignal.label}: {historicalSignal.triggered ? "YES" : "NO"}
        </span>
        {historicalSignal.isProxy && (
          <p className="mt-1 text-xs">{historicalSignal.proxyExplanation}</p>
        )}
        <p className="mt-1 text-xs">
          Historical high-signal pattern — directional evidence from past hires, not a guaranteed
          prediction.
        </p>
      </div>
    </section>
  );
}

function CriterionCard({
  applicationId,
  criterion,
}: {
  applicationId: string;
  criterion: CriterionResult;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newScore, setNewScore] = useState(String(criterion.score));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitOverride() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "criterionScore",
          criterionKey: criterion.key,
          value: newScore,
          reason: reason || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Override failed.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Override failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-foreground">{criterion.name}</h3>
          <p className="mt-0.5 text-xs text-muted">Weight {Math.round(criterion.weight * 100)}%</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-semibold text-foreground tabular-nums">
            {criterion.score}/4
          </div>
          <div className="text-xs text-muted">weighted {criterion.weightedScore.toFixed(2)}</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground">{criterion.rationale}</p>

      {criterion.evidenceRefs.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {criterion.evidenceRefs.map((ref, i) => (
            <blockquote
              key={i}
              className="border-l-2 border-border-strong pl-2 text-xs text-muted italic"
            >
              &ldquo;{ref}&rdquo;
            </blockquote>
          ))}
        </div>
      )}

      {criterion.missingEvidence && (
        <p className="mt-2 text-xs text-score-mid">Missing: {criterion.missingEvidence}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <ConfidenceLabel confidence={criterion.confidence} />
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="cursor-pointer text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Override score
          </button>
        ) : null}
      </div>

      {editing && (
        <div className="mt-3 flex flex-col gap-2 rounded-md border border-border-strong bg-surface-2 p-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">New score</label>
            <select
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Why are you overriding this? (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
          />
          {error && <p className="text-xs text-score-low">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="cursor-pointer rounded px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submitOverride}
              className="cursor-pointer rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save override"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
