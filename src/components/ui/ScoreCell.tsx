function scoreColor(score: number): string {
  if (score >= 4) return "var(--score-high)";
  if (score >= 2.5) return "var(--score-mid)";
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
