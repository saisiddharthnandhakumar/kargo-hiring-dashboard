export function ConfidenceLabel({ confidence }: { confidence: number }) {
  const label = confidence >= 0.8 ? "High" : confidence >= 0.5 ? "Medium" : "Low";
  const color =
    confidence >= 0.8 ? "var(--score-high)" : confidence >= 0.5 ? "var(--score-mid)" : "var(--score-low)";
  const percent = Math.round(confidence * 100);
  return (
    <span
      className="font-mono text-xs"
      style={{ color }}
      title="How sure the AI is about this, based on how clear and direct the CV evidence is. It is not part of the score."
    >
      <span className="text-muted">AI confidence:</span> {label} ({percent}%)
    </span>
  );
}
