import type { DashboardSummary } from "@/lib/dashboard/get-dashboard-data";

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const cards: { label: string; value: string }[] = [
    { label: "Applications", value: String(summary.applications) },
    { label: "Reviewed", value: String(summary.reviewed) },
    { label: "Shortlisted", value: String(summary.shortlisted) },
    { label: "Interview", value: String(summary.interview) },
    { label: "Rejected", value: String(summary.rejected) },
    {
      label: "Avg. score",
      value: summary.averageScore !== null ? summary.averageScore.toFixed(2) : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-surface px-4 py-3">
          <div className="font-mono text-2xl font-medium tabular-nums text-foreground">
            {card.value}
          </div>
          <div className="mt-1 text-xs text-muted">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
