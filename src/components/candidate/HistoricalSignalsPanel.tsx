import type { HistoricalSignalChecks, SignalCheck } from "@/lib/candidate-detail/historical-signals";

const STATUS_ICON: Record<SignalCheck["status"], { symbol: string; color: string }> = {
  present: { symbol: "✓", color: "var(--score-high)" },
  absent: { symbol: "—", color: "var(--muted-2)" },
  unclear: { symbol: "?", color: "var(--score-mid)" },
};

function CheckRow({ label, check }: { label: string; check: SignalCheck }) {
  const meta = STATUS_ICON[check.status];
  return (
    <div className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-xs"
        style={{ borderColor: meta.color, color: meta.color }}
      >
        {meta.symbol}
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted">{check.detail}</p>
      </div>
    </div>
  );
}

export function HistoricalSignalsPanel({ checks }: { checks: HistoricalSignalChecks }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-foreground">
        Historical signals
      </h3>
      <p className="mt-1 text-xs text-muted">
        Patterns found across Kargo&apos;s 8 past hires that the job description alone doesn&apos;t
        score for. Directional evidence signals, not pass/fail rules.
      </p>
      <div className="mt-2">
        <CheckRow label="Domain grounding" check={checks.domainGrounding} />
        <CheckRow label="Self-initiated action" check={checks.selfInitiatedAction} />
        <CheckRow label="Non-linear career" check={checks.nonLinearCareer} />
      </div>
    </section>
  );
}
