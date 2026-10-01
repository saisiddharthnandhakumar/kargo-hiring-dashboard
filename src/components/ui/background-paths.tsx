import Link from "next/link";
import { Button } from "@/components/ui/button";

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${
      312 - i * 5 * position
    } ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${
      470 - i * 6
    } ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  // The paths themselves are static; only the wrapper's transform animates.
  // Animating pathLength/pathOffset per path (the previous approach) made
  // Chromium repaint all 72 full-screen strokes every frame, which starved
  // the hero text and CTA layers and left them painting blank.
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${position > 0 ? "paths-drift" : "paths-drift-reverse"}`}
    >
      <svg className="h-full w-full text-slate-950 dark:text-white" viewBox="0 0 696 316" fill="none" aria-hidden="true">
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.04 + path.id * 0.012}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths({
  title = "Background Paths",
  subtitle,
  ctaLabel = "Discover Excellence",
  ctaHref = "/",
  secondaryLabel,
  secondaryHref,
  footnote,
}: {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  footnote?: string[];
}) {
  const words = title.split(" ");

  return (
    <div className="relative isolate flex min-h-[calc(100svh-4.5rem)] w-full items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0 -z-10">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Every entrance below is a one-shot CSS animation (fill-mode: both),
          so once it lands the content is static and stays painted. */}
      <div className="container mx-auto px-4 text-center md:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 font-[family-name:var(--font-display)] text-5xl font-bold tracking-tighter text-neutral-900 sm:text-7xl md:text-8xl dark:text-white">
            {words.map((word, wordIndex) => (
              <span
                key={wordIndex}
                className="hero-rise mr-4 inline-block last:mr-0"
                style={{ animationDelay: `${wordIndex * 0.08}s` }}
              >
                {word}
              </span>
            ))}
          </h1>

          {subtitle && (
            <p
              className="hero-rise mx-auto mb-10 max-w-xl text-base text-neutral-600 sm:text-lg dark:text-neutral-400"
              style={{ animationDelay: "0.45s" }}
            >
              {subtitle}
            </p>
          )}

          <div
            className="hero-rise flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="group relative inline-block overflow-hidden rounded-2xl bg-gradient-to-b from-black/10 to-white/10 p-px shadow-lg transition-shadow duration-300 hover:shadow-xl dark:from-white/10 dark:to-black/10">
              <Button
                asChild
                variant="ghost"
                className="h-auto rounded-[1.15rem] border border-black/10 bg-white px-8 py-5 text-lg font-semibold text-black transition-transform duration-300 group-hover:-translate-y-0.5 hover:bg-white hover:text-black dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-black dark:hover:text-white"
              >
                <Link href={ctaHref}>
                  <span>{ctaLabel}</span>
                  <span className="ml-3 opacity-70 transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </Link>
              </Button>
            </div>

            {secondaryLabel && secondaryHref && (
              <Link
                href={secondaryHref}
                className="text-sm font-medium text-neutral-600 underline-offset-4 transition-colors hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-white"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>

          {footnote && footnote.length > 0 && (
            <ul
              className="hero-rise mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-xs tracking-wide text-neutral-500 uppercase"
              style={{ animationDelay: "0.8s" }}
            >
              {footnote.map((item, i) => (
                <li key={item} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
