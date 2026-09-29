import type { AuditLogEntry } from "@/lib/repositories";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AuditTrail({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-border-strong p-4 text-xs text-muted">
        No founder overrides recorded yet for this candidate.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-foreground">
        Audit trail
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id} className="border-b border-border pb-2 text-xs last:border-0">
            <span className="font-medium text-foreground">{entry.actor}</span>{" "}
            <span className="text-muted">changed</span>{" "}
            <span className="font-mono text-foreground">{entry.field}</span>{" "}
            <span className="text-muted">from</span>{" "}
            <span className="text-score-low">{entry.oldValue ?? "—"}</span>{" "}
            <span className="text-muted">to</span>{" "}
            <span className="text-score-high">{entry.newValue}</span>
            {entry.reason && <span className="text-muted"> — &ldquo;{entry.reason}&rdquo;</span>}
            <span className="ml-2 text-muted-2">{formatTimestamp(entry.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
