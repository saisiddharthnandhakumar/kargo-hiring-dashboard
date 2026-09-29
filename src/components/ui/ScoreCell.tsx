// Thresholds are proportional to the 1-4 scale (80% / 50% of max, same
// proportions as the old 1-5 scale).
function scoreColor(score: number): string {
  if (score >= 3.2) return "var(--score-high)";
  if (score >= 2) return "var(--score-mid)";
  return "var(--score-low)";
}

export function ScoreCell({ score, bold = false }: { score: number | null; bold?: boolean }) {
  if (score === null) {
    return <span className="font-mono text-sm text-muted-2">—</span>;
  }
  return (
    <span
      className={`font-mono text-sm tabular-nums ${bold ? "font-semibold" : ""}`}
      style={{ color: scoreColor(score) }}
    >
      {score.toFixed(2)}
    </span>
  );
}
