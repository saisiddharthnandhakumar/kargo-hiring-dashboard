import { AUTO_DRAFT_SCORE_THRESHOLD } from "@/lib/scoring/thresholds";

/** The AI's recommendation (invite vs. reject), distinct from the
 * founder-driven workflow `status` shown in StatusBadge — the two can
 * diverge (e.g. the founder already overrode a reject into an interview).
 * Icon + text always together, never color alone (WCAG 1.4.1). */
export function VerdictBadge({
  overallScore,
  size = "sm",
}: {
  overallScore: number | null;
  size?: "sm" | "lg";
}) {
  const textSize = size === "lg" ? "text-sm" : "text-xs";
  const gap = size === "lg" ? "gap-2" : "gap-1.5";

  if (overallScore === null) {
    return (
      <span
        className={`inline-flex items-center ${gap} ${textSize} font-medium text-muted-2`}
        aria-label="Verdict: pending, not yet scored"
      >
        <span aria-hidden="true">·</span> Pending
      </span>
    );
  }

  const isInvite = overallScore >= AUTO_DRAFT_SCORE_THRESHOLD;
  const color = isInvite ? "var(--score-high)" : "var(--score-low)";
  const label = isInvite ? "Invite ready" : "Reject ready";
  const icon = isInvite ? "▲" : "▼";

  return (
    <span
      className={`inline-flex items-center ${gap} ${textSize} font-semibold`}
      style={{ color }}
      aria-label={`Verdict: ${label}, score ${overallScore.toFixed(2)} of 4`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
