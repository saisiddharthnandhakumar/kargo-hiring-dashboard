/**
 * Applies neon/migrations/*.sql (in filename order) against Neon using a
 * DIRECT (unpooled) connection, per the neon-postgres skill's migration
 * guidance — never the pooled DATABASE_URL for DDL. No migration-tracking
 * table yet (single migration, MVP); each file runs inside one transaction.
 *
 * Run with: npm run migrate:neon
 */
import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const MIGRATIONS_DIR = path.join(process.cwd(), "neon", "migrations");

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_UNPOOLED is not set — run `neon env pull` (or `neon link` / `neon deploy`) first.",
    );
  }

  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const file of files) {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf-8");
      console.log(`Applying ${file}...`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("commit");
        console.log(`  done.`);
      } catch (err) {
        await client.query("rollback");
        throw new Error(`Migration ${file} failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  } finally {
    await client.end();
  }

  console.log("All migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
