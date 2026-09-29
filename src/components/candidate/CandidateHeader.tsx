import Link from "next/link";
import { ScoreCell } from "@/components/ui/ScoreCell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ApplicationStatus } from "@/lib/repositories";

export function CandidateHeader({
  name,
  currentRole,
  roleTitle,
  overallScore,
  status,
}: {
  name: string;
  currentRole: string | null;
  roleTitle: string;
  overallScore: number | null;
  status: ApplicationStatus;
}) {
  return (
    <header className="mb-6">
      <Link href="/dashboard" className="text-xs text-muted hover:text-foreground">
        ← Back to dashboard
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground">
            {name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {currentRole ?? "Current role not found in CV"} · Applying for {roleTitle}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ScoreCell score={overallScore} bold />
          <StatusBadge status={status} />
        </div>
      </div>
    </header>
  );
}
