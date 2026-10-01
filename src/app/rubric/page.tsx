import Link from "next/link";
import { RubricTable } from "@/components/rubric/RubricTable";
import { HISTORICAL_PATTERNS, getDefaultWeights, isValidRoleKey, type RoleKey } from "@/lib/rubric";
import { getEffectiveRubric } from "@/lib/rubric/effective";

export const dynamic = "force-dynamic";

function resolveRole(raw: string | string[] | undefined): RoleKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && isValidRoleKey(value) ? value : "pm";
}

export default async function RubricPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const params = await searchParams;
  const role = resolveRole(params.role);
  const rubric = await getEffectiveRubric(role);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Link href="/dashboard" className="text-xs text-muted hover:text-foreground">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground">
        The Rubric: Deconstructing &ldquo;Good {role === "pm" ? "PM" : "SPM"}&rdquo;
      </h1>
      <p className="mt-1 text-sm text-muted">
        This is the exact rubric the AI scores against — an overlay on the job description, never
        a replacement for it. AI scores never hide behind a single number; this page is always
        available so you can check the anchors yourself.
      </p>
      <Link
        href="/calibration-set"
        className="mt-2 inline-block text-xs text-accent underline underline-offset-4 hover:text-foreground"
      >
        View the 8-hire calibration set this rubric was built from →
      </Link>

      <nav aria-label="Select role" className="mt-6 flex gap-1 border-b border-border">
        {(["pm", "spm"] as const).map((key) => (
          <Link
            key={key}
            href={`/rubric?role=${key}`}
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

      <RubricTable key={role} role={role} rubric={rubric} defaultWeights={getDefaultWeights(role)} />

      <article className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
        <h2 className="font-medium text-foreground">{rubric.historicalSignalRule.label}</h2>
        <p className="mt-1 text-sm text-muted">
          Triggered only when both {rubric.historicalSignalRule.criteriaKeys.join(" AND ")} score
          exactly 4/4 (Strong). This combination had a 100% &ldquo;Exceeds&rdquo; hit rate in the
          8-hire calibration set — presented as a historical high-signal pattern, never a
          guaranteed prediction.
        </p>
        {rubric.historicalSignalRule.isProxy && (
          <p className="mt-2 text-xs text-muted">{rubric.historicalSignalRule.proxyExplanation}</p>
        )}
      </article>

      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
          Cross-role historical patterns
        </h2>
        <p className="mt-1 text-sm text-muted">
          Found across all 8 past hires (not just Product), calibrated from what the job
          descriptions alone missed. Directional evidence signals, not deterministic rules.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {HISTORICAL_PATTERNS.map((p) => (
            <article key={p.key} className="rounded-lg border border-border bg-surface p-4">
              <h3 className="font-medium text-foreground">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.description}</p>
              <p className="mt-2 text-xs text-muted-2">Why the JD misses it: {p.whyJdsMissIt}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
