import type { DashboardSummary } from "@/lib/dashboard/row";

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const cards: { label: string; value: number; tone?: "high" | "low" | "accent" }[] = [
    { label: "Applicants", value: summary.applicants },
    { label: "Passed", value: summary.passed, tone: "high" },
    { label: "Not passed", value: summary.notPassed, tone: "low" },
    { label: "Emails to send", value: summary.awaitingEmail, tone: "accent" },
    { label: "Emailed", value: summary.emailed },
  ];

  const toneClass = { high: "text-score-high", low: "text-score-low", accent: "text-accent" };

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col-reverse bg-surface px-4 py-3 last:col-span-2 sm:last:col-span-1"
        >
          <dt className="mt-0.5 text-xs text-muted">{card.label}</dt>
          <dd
            className={`font-mono text-2xl font-medium tabular-nums ${
              card.tone ? toneClass[card.tone] : "text-foreground"
            }`}
          >
            {card.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
