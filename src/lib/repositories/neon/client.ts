import { Pool } from "pg";

// Pooled connection for normal application traffic, per the neon-postgres
// skill: DATABASE_URL (pooled, PgBouncer) for queries, DATABASE_URL_UNPOOLED
// (direct) reserved for migrations only — see scripts/migrate-neon.ts.
let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — run `neon link` / `neon deploy` first.");
  }

  pool = new Pool({ connectionString });
  return pool;
}
