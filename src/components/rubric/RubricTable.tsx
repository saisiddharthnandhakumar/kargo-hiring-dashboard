"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, RotateCcw } from "lucide-react";
import type { Rubric, RoleKey } from "@/lib/rubric/types";

function toPercents(weights: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(weights).map(([k, w]) => [k, Math.round(w * 100)]));
}

export function RubricTable({
  role,
  rubric,
  defaultWeights,
}: {
  role: RoleKey;
  rubric: Rubric;
  defaultWeights: Record<string, number>;
}) {
  const router = useRouter();
  const current = toPercents(Object.fromEntries(rubric.criteria.map((c) => [c.key, c.weight])));
  const defaults = toPercents(defaultWeights);
  const isCustomized = rubric.criteria.some((c) => current[c.key] !== defaults[c.key]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const draftNumbers = Object.fromEntries(
    rubric.criteria.map((c) => [c.key, draft[c.key] === "" ? NaN : Number(draft[c.key])]),
  );
  const allValid = Object.values(draftNumbers).every((n) => Number.isInteger(n) && n >= 0 && n <= 100);
  const total = Object.values(draftNumbers).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
  const canSave = allValid && total === 100 && !saving;

  function startEditing() {
    setDraft(Object.fromEntries(rubric.criteria.map((c) => [c.key, String(current[c.key])])));
    setError(null);
    setNotice(null);
    setEditing(true);
  }

  async function save(weights: Record<string, number> | null) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/rubric", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, weights }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save the weights.");
      return;
    }
    setEditing(false);
    setNotice(
      `${weights ? "Weights saved" : "Calibrated weights restored"} — ${data.rescored} existing score${
        data.rescored === 1 ? "" : "s"
      } recalculated.`,
    );
    router.refresh();
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {isCustomized ? "Using your custom weights." : "Using the calibrated weights."} Changing a weight
          recalculates every existing score for this role — no CVs are re-read.
        </p>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="inline-flex min-h-9 cursor-pointer items-center rounded-lg px-3 text-sm text-muted hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => save(draftNumbers)}
                disabled={!canSave}
                className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Save weights
              </button>
            </>
          ) : (
            <>
              {isCustomized && (
                <button
                  type="button"
                  onClick={() => save(null)}
                  disabled={saving}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-muted hover:text-foreground disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset to calibrated
                </button>
              )}
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-3.5 text-sm font-medium text-foreground hover:bg-surface-hover"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit weights
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-score-low">{error}</p>}
      {notice && !editing && <p className="mb-3 text-sm text-score-high">{notice}</p>}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="min-w-[220px] px-4 py-3 font-medium text-foreground">Criterion</th>
              <th className="w-28 px-4 py-3 font-medium text-foreground">Weight</th>
              <th className="min-w-[200px] px-4 py-3 font-medium text-score-low">1 · Absent</th>
              <th className="min-w-[200px] px-4 py-3 font-medium text-score-mid">2 · Weak</th>
              <th className="min-w-[200px] px-4 py-3 font-medium text-foreground">3 · Present</th>
              <th className="min-w-[200px] px-4 py-3 font-medium text-score-high">4 · Strong</th>
            </tr>
          </thead>
          <tbody>
            {rubric.criteria.map((c, i) => (
              <tr key={c.key} className={i % 2 === 1 ? "bg-surface/50" : undefined}>
                <td className="align-top border-t border-border px-4 py-3">
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="mt-1 text-xs text-muted">{c.description}</p>
                  {c.redFlag && (
                    <p className="mt-2 text-xs text-score-low">
                      <span className="font-medium">Red flag:</span> {c.redFlag}
                    </p>
                  )}
                  {c.note && (
                    <p className="mt-2 text-xs text-score-mid">
                      <span className="font-medium">Note:</span> {c.note}
                    </p>
                  )}
                </td>
                <td className="align-top border-t border-border px-4 py-3 font-mono text-foreground">
                  {editing ? (
                    <label className="flex items-center gap-1">
                      <span className="sr-only">Weight for {c.name}, percent</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={100}
                        step={1}
                        value={draft[c.key] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                        className="w-16 rounded-md border border-border-strong bg-background px-2 py-1 text-right font-mono text-sm text-foreground focus:border-accent focus:outline-none"
                      />
                      <span className="text-muted">%</span>
                    </label>
                  ) : (
                    <>
                      {current[c.key]}%
                      {current[c.key] !== defaults[c.key] && (
                        <span className="mt-1 block text-[11px] text-muted-2">was {defaults[c.key]}%</span>
                      )}
                    </>
                  )}
                </td>
                <td className="align-top border-t border-border px-4 py-3 text-foreground">{c.anchors[1]}</td>
                <td className="align-top border-t border-border px-4 py-3 text-foreground">{c.anchors[2]}</td>
                <td className="align-top border-t border-border px-4 py-3 text-foreground">{c.anchors[3]}</td>
                <td className="align-top border-t border-border px-4 py-3 text-foreground">{c.anchors[4]}</td>
              </tr>
            ))}
          </tbody>
          {editing && (
            <tfoot>
              <tr className="border-t border-border bg-surface">
                <td className="px-4 py-3 text-right text-xs text-muted">Total</td>
                <td
                  className={`px-4 py-3 font-mono font-semibold ${
                    total === 100 ? "text-score-high" : "text-score-low"
                  }`}
                  aria-live="polite"
                >
                  {total}%
                </td>
                <td colSpan={4} className="px-4 py-3 text-xs text-muted">
                  {!allValid
                    ? "Each weight must be a whole number from 0 to 100."
                    : total === 100
                      ? "Ready to save."
                      : `Weights must add up to 100% — ${total > 100 ? `remove ${total - 100}` : `add ${100 - total}`}%.`}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
