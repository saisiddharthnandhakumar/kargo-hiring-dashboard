import type { ApplicationStatus } from "@/lib/repositories";

const STATUS_META: Record<ApplicationStatus, { label: string; color: string }> = {
  NEW: { label: "New", color: "var(--status-new)" },
  PROCESSING: { label: "Processing", color: "var(--status-processing)" },
  REVIEWED: { label: "Reviewed", color: "var(--status-reviewed)" },
  SHORTLISTED: { label: "Shortlisted", color: "var(--status-shortlisted)" },
  INTERVIEW: { label: "Interview", color: "var(--status-interview)" },
  REJECTED: { label: "Rejected", color: "var(--status-rejected)" },
  HIRED: { label: "Hired", color: "var(--status-hired)" },
  PROCESSING_FAILED: { label: "Failed", color: "var(--status-failed)" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide whitespace-nowrap"
      style={{ borderColor: meta.color, color: meta.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}
