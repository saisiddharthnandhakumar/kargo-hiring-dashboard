export function ConcernsPanel({
  strengths,
  concerns,
}: {
  strengths: string[];
  concerns: string[];
}) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-score-high">Strengths</h3>
        <ul className="mt-2 flex flex-col gap-2 text-sm text-foreground">
          {strengths.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-score-high">+</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-score-low">Concerns / gaps</h3>
        <ul className="mt-2 flex flex-col gap-2 text-sm text-foreground">
          {concerns.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-score-low">–</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
