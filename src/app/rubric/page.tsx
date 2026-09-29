import Link from "next/link";
import { HISTORICAL_PATTERNS, getRubric, isValidRoleKey, type RoleKey } from "@/lib/rubric";

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
  const rubric = getRubric(role);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/dashboard" className="text-xs text-muted hover:text-foreground">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground">
        Hiring rubric
      </h1>
      <p className="mt-1 text-sm text-muted">
        This is the exact rubric the AI scores against — an overlay on the job description, never
        a replacement for it. AI scores never hide behind a single number; this page is always
        available so you can check the anchors yourself.
      </p>

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

      <section className="mt-6 flex flex-col gap-4">
        {rubric.criteria.map((c) => (
          <article key={c.key} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-medium text-foreground">{c.name}</h2>
              <span className="shrink-0 font-mono text-sm text-muted">
                {Math.round(c.weight * 100)}%
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{c.description}</p>

            <div className="mt-3 flex flex-col gap-2">
              <AnchorRow score={5} text={c.anchors[5]} />
              <AnchorRow score={3} text={c.anchors[3]} />
              <AnchorRow score={1} text={c.anchors[1]} />
            </div>

            {c.redFlag && (
              <p className="mt-3 text-xs text-score-low">
                <span className="font-medium">Red flag:</span> {c.redFlag}
              </p>
            )}
            {c.note && (
              <p className="mt-2 text-xs text-score-mid">
                <span className="font-medium">Note:</span> {c.note}
              </p>
            )}
          </article>
        ))}

        <article className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <h2 className="font-medium text-foreground">{rubric.historicalSignalRule.label}</h2>
          <p className="mt-1 text-sm text-muted">
            Triggered only when both {rubric.historicalSignalRule.criteriaKeys.join(" AND ")} score
            exactly 5/5. This combination had a 100% &ldquo;Exceeds&rdquo; hit rate in the 8-hire
            calibration set — presented as a historical high-signal pattern, never a guaranteed
            prediction.
          </p>
          {rubric.historicalSignalRule.isProxy && (
            <p className="mt-2 text-xs text-muted">{rubric.historicalSignalRule.proxyExplanation}</p>
          )}
        </article>
      </section>

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

function AnchorRow({ score, text }: { score: 5 | 3 | 1; text: string }) {
  const color = score === 5 ? "var(--score-high)" : score === 3 ? "var(--score-mid)" : "var(--score-low)";
  return (
    <div className="flex gap-3 text-sm">
      <span
        className="mt-0.5 flex h-5 w-7 shrink-0 items-center justify-center rounded border font-mono text-xs"
        style={{ borderColor: color, color }}
      >
        {score}
      </span>
      <p className="text-foreground">{text}</p>
    </div>
  );
}
