import { CandidateTable } from "@/components/dashboard/CandidateTable";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { RoleTabs } from "@/components/dashboard/RoleTabs";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { isValidRoleKey, type RoleKey } from "@/lib/rubric";

export const dynamic = "force-dynamic";

function resolveRole(raw: string | string[] | undefined): RoleKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && isValidRoleKey(value) ? value : "pm";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const params = await searchParams;
  const role = resolveRole(params.role);
  const data = await getDashboardData(role);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground">
          Hiring Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          The system recommends. You decide. Every score below is one click from its evidence.
        </p>
      </header>

      <div className="relative mb-6 flex items-center justify-between gap-4">
        <RoleTabs active={role} />
        <DashboardActions role={role} />
      </div>

      <div className="mb-6">
        <SummaryCards summary={data.summary} />
      </div>

      <CandidateTable rows={data.rows} />
    </main>
  );
}
