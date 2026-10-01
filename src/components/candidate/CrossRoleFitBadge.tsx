import { getRubric, type RoleKey } from "@/lib/rubric";

/** Icon + tooltip rather than a dedicated table column (Hick's Law — this
 * only applies to a minority of rows). On the candidate detail page it's
 * rendered as a full inline badge instead, right next to the role-override
 * control that acts on it. */
export function CrossRoleFitBadge({
  fit,
  variant = "icon",
}: {
  fit: { roleKey: RoleKey; overallScore: number };
  variant?: "icon" | "full";
}) {
  const roleTitle = getRubric(fit.roleKey).roleTitle;
  const label = `Also strong fit for ${roleTitle} (${fit.overallScore.toFixed(2)}/4)`;

  if (variant === "icon") {
    return (
      <span className="font-mono text-xs text-accent" title={label} aria-label={label}>
        ⇄
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
      <span aria-hidden="true">⇄</span>
      {label}
    </span>
  );
}
