import type { Repositories } from "./types";
import { buildMemoryRepositories } from "./memory";
import { buildNeonRepositories } from "./neon";

/**
 * Deliberately NOT cached on globalThis. Building a Repositories object is
 * just wiring up a handful of closures — the Neon `pg.Pool` itself is
 * cached separately in neon/client.ts, so there's no real cost to
 * rebuilding this wiring per call. Caching the whole object was tried and
 * reverted: it survives Next.js dev-server route-module reloads, which
 * means adding a method to a repository interface silently breaks every
 * already-open route until the whole process restarts.
 */
export function getRepositories(): Repositories {
  const hasNeon = Boolean(process.env.DATABASE_URL);
  return hasNeon ? buildNeonRepositories() : buildMemoryRepositories();
}
