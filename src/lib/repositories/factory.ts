import type { Repositories } from "./types";
import { buildMemoryRepositories } from "./memory";
import { buildSupabaseRepositories } from "./supabase";

/**
 * Deliberately NOT cached on globalThis. Building a Repositories object is
 * just wiring up a handful of closures — there's no connection pool or file
 * handle opened at construction time (each memory-store call opens/reads
 * the JSON file fresh; a real Supabase client is cheap to construct too) —
 * so there's no meaningful cost to rebuilding it per call. Caching it was
 * tried and reverted: it survives Next.js dev-server route-module reloads,
 * which means adding a method to a repository interface silently breaks
 * every already-open route until the whole process restarts. Not caching
 * trades a negligible allocation for that entire class of bug going away.
 */
export function getRepositories(): Repositories {
  const hasSupabase = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  return hasSupabase ? buildSupabaseRepositories() : buildMemoryRepositories();
}
