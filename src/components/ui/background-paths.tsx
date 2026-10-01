"use client";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
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
    // Deterministic stand-in for the original Math.random() so server and
    // client render the same thing.
    duration: 20 + ((i * 37) % 10),
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="h-full w-full text-slate-950 dark:text-white" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: path.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
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
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-[calc(100svh-4.5rem)] w-full items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        {/* Own compositor layer: the 72 continuously-repainting paths
            otherwise invalidate the text above them and it can paint blank. */}
        <div className="relative z-10 container mx-auto px-4 text-center [transform:translateZ(0)] md:px-6">
          {/* No wrapper fade: an opacity animation over these layers leaves
              Chromium painting a stale (blank) frame once it settles. */}
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 font-[family-name:var(--font-display)] text-5xl font-bold tracking-tighter sm:text-7xl md:text-8xl">
              {words.map((word, wordIndex) => (
                <span key={wordIndex} className="mr-4 inline-block last:mr-0">
                  {word.split("").map((letter, letterIndex) => (
                    <motion.span
                      key={`${wordIndex}-${letterIndex}`}
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: wordIndex * 0.1 + letterIndex * 0.03,
                        type: "spring",
                        stiffness: 150,
                        damping: 25,
                      }}
                      className="inline-block bg-gradient-to-r from-neutral-900 to-neutral-700/80 bg-clip-text text-transparent dark:from-white dark:to-white/80"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
            </h1>

            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mx-auto mb-10 max-w-xl text-base text-neutral-600 sm:text-lg dark:text-neutral-400"
              >
                {subtitle}
              </motion.p>
            )}

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <div className="group relative inline-block overflow-hidden rounded-2xl bg-gradient-to-b from-black/10 to-white/10 p-px shadow-lg transition-shadow duration-300 hover:shadow-xl dark:from-white/10 dark:to-black/10">
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto rounded-[1.15rem] border border-black/10 bg-white/95 px-8 py-5 text-lg font-semibold text-black transition-all duration-300 group-hover:-translate-y-0.5 hover:bg-white/100 hover:text-black hover:shadow-md dark:border-white/10 dark:bg-black/95 dark:text-white dark:hover:bg-black/100 dark:hover:text-white dark:hover:shadow-neutral-800/50"
                >
                  <Link href={ctaHref}>
                    <span className="opacity-90 transition-opacity group-hover:opacity-100">{ctaLabel}</span>
                    <span className="ml-3 opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100">
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
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-xs tracking-wide text-neutral-500 uppercase"
              >
                {footnote.map((item, i) => (
                  <li key={item} className="flex items-center gap-3">
                    {i > 0 && <span aria-hidden="true">·</span>}
                    {item}
                  </li>
                ))}
              </motion.ul>
            )}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
