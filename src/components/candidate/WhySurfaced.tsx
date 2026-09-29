export function WhySurfaced({ text }: { text: string }) {
  return (
    <section className="rounded-lg border border-accent/30 bg-accent/5 p-4">
      <h2 className="text-xs font-medium tracking-wide text-accent uppercase">
        Why this candidate surfaced
      </h2>
      <p className="mt-1.5 text-sm text-foreground">{text}</p>
    </section>
  );
}
