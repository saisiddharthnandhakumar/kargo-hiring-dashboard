import Link from "next/link";
import { CandidateTable } from "@/components/dashboard/CandidateTable";
import { getCalibrationSetData } from "@/lib/dashboard/get-calibration-set-data";
import { isValidRoleKey, type RoleKey } from "@/lib/rubric";

export const dynamic = "force-dynamic";

function resolveRole(raw: string | string[] | undefined): RoleKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && isValidRoleKey(value) ? value : "pm";
}

export default async function CalibrationSetPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const params = await searchParams;
  const role = resolveRole(params.role);
  const rows = await getCalibrationSetData(role);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Link href="/rubric" className="text-xs text-muted hover:text-foreground">
        ← Back to rubric
      </Link>
      <header className="mt-2 mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground">
          Calibration Set
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          The 8 past hires (5 Exceeds / 2 Meets / 1 Below) used to build the rubric on the{" "}
          <Link href="/rubric" className="underline underline-offset-4 hover:text-foreground">
            /rubric
          </Link>{" "}
          page. Reference only — read-only, excluded from the live dashboard and its summary
          counts.
        </p>
      </header>

      <nav aria-label="Select role" className="mb-6 flex gap-1 border-b border-border">
        {(["pm", "spm"] as const).map((key) => (
          <Link
            key={key}
            href={`/calibration-set?role=${key}`}
            aria-current={key === role ? "page" : undefined}
            className={`relative px-4 py-2.5 text-sm font-medium ${
              key === role ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {key === "pm" ? "Product Manager" : "Senior Product Manager"}
            {key === role && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" aria-hidden="true" />
            )}
          </Link>
        ))}
      </nav>

      <CandidateTable rows={rows} readOnly />
    </main>
  );
}
