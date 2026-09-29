export function ConfidenceLabel({ confidence }: { confidence: number }) {
  const label = confidence >= 0.8 ? "High" : confidence >= 0.5 ? "Medium" : "Low";
  const color =
    confidence >= 0.8 ? "var(--score-high)" : confidence >= 0.5 ? "var(--score-mid)" : "var(--score-low)";
  return (
    <span className="font-mono text-xs" style={{ color }}>
      {label} ({confidence.toFixed(2)})
    </span>
  );
}
