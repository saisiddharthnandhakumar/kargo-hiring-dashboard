import { CandidateTable } from "@/components/dashboard/CandidateTable";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { RoleTabs } from "@/components/dashboard/RoleTabs";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { UploadCard } from "@/components/dashboard/UploadCard";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { isValidRoleKey, type RoleKey } from "@/lib/rubric";

export const dynamic = "force-dynamic";

function first(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

function resolveRole(raw: string | string[] | undefined): RoleKey {
  const value = first(raw);
  return value && isValidRoleKey(value) ? value : "pm";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[]; upload?: string | string[] }>;
}) {
  const params = await searchParams;
  const role = resolveRole(params.role);
  const data = await getDashboardData(role);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground sm:text-4xl">
          Shortlist
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ranked against your best past hires. Passed → invite. Not passed → a kind no. You hit send.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <RoleTabs active={role} />
        <DashboardActions />
      </div>

      <div className="flex flex-col gap-5">
        <SummaryCards summary={data.summary} />
        <UploadCard key={role} role={role} highlight={first(params.upload) === "1"} />
        <CandidateTable rows={data.rows} />
      </div>
    </main>
  );
}
