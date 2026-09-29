"use client";

import { useState } from "react";
import type { InterviewBrief } from "@/lib/repositories/types";

export function InterviewBriefPanel({
  applicationId,
  initialBrief,
}: {
  applicationId: string;
  initialBrief: InterviewBrief | null;
}) {
  const [brief, setBrief] = useState(initialBrief);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/brief`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate brief.");
        return;
      }
      setBrief(data.brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate brief.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Interview brief
        </h2>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
        >
          {loading ? "Generating…" : brief ? "Regenerate" : "Generate Interview Brief"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-score-low">{error}</p>}

      {brief && (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
              Candidate snapshot
            </h3>
            <p className="mt-1 text-sm text-foreground">{brief.summary}</p>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
              Why shortlisted
            </h3>
            <p className="mt-1 text-sm text-foreground">{brief.whyShortlisted}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-medium tracking-wide text-score-high uppercase">
                Strengths
              </h3>
              <ul className="mt-1 flex flex-col gap-1 text-sm text-foreground">
                {brief.strengths.map((s, i) => (
                  <li key={i}>+ {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium tracking-wide text-score-mid uppercase">
                Uncertainties
              </h3>
              <ul className="mt-1 flex flex-col gap-1 text-sm text-foreground">
                {brief.uncertainties.map((u, i) => (
                  <li key={i}>? {u}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
              Suggested questions
            </h3>
            <div className="mt-2 flex flex-col gap-3">
              {brief.questions.map((q, i) => (
                <div key={i} className="rounded-md border border-border bg-surface-2 p-3">
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  <p className="mt-1 text-xs text-muted">Probes for: {q.probesFor}</p>
                  <p className="mt-1 text-xs text-score-high">
                    Strong answer shows: {q.whatAGoodAnswerShows}
                  </p>
                  <p className="mt-1 text-xs text-score-low">
                    Would weaken confidence: {q.whatWouldWeakenConfidence}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
              Follow-up probes
            </h3>
            <p className="mt-1 text-sm text-foreground">{brief.followUpProbes.join(" · ")}</p>
          </div>
        </div>
      )}
    </section>
  );
}
