import type { BatchRunRepository } from "../types";
import { getPool } from "./client";
import { batchRunFromRow } from "./mappers";

export function createNeonBatchRunRepository(): BatchRunRepository {
  const pool = getPool();

  return {
    async start(totalCount) {
      const { rows } = await pool.query(
        `insert into batch_runs (status, total_count) values ('running', $1) returning *`,
        [totalCount],
      );
      return batchRunFromRow(rows[0]);
    },

    async update(id, patch) {
      const sets: string[] = [];
      const params: unknown[] = [id];

      function set(column: string, value: unknown) {
        params.push(value);
        sets.push(`${column} = $${params.length}`);
      }

      if (patch.status !== undefined) set("status", patch.status);
      if (patch.totalCount !== undefined) set("total_count", patch.totalCount);
      if (patch.processedCount !== undefined) set("processed_count", patch.processedCount);
      if (patch.succeededCount !== undefined) set("succeeded_count", patch.succeededCount);
      if (patch.failedCount !== undefined) set("failed_count", patch.failedCount);
      if (patch.currentApplicationId !== undefined) set("current_application_id", patch.currentApplicationId);
      if (patch.failures !== undefined) set("failures", JSON.stringify(patch.failures));
      if (patch.finishedAt !== undefined) set("finished_at", patch.finishedAt);

      if (sets.length === 0) {
        const { rows } = await pool.query("select * from batch_runs where id = $1", [id]);
        if (!rows[0]) throw new Error(`Batch run not found: ${id}`);
        return batchRunFromRow(rows[0]);
      }

      const { rows } = await pool.query(
        `update batch_runs set ${sets.join(", ")} where id = $1 returning *`,
        params,
      );
      if (!rows[0]) throw new Error(`Batch run not found: ${id}`);
      return batchRunFromRow(rows[0]);
    },

    async getById(id) {
      const { rows } = await pool.query("select * from batch_runs where id = $1", [id]);
      return rows[0] ? batchRunFromRow(rows[0]) : null;
    },

    async getLatest() {
      const { rows } = await pool.query(
        "select * from batch_runs order by started_at desc limit 1",
      );
      return rows[0] ? batchRunFromRow(rows[0]) : null;
    },
  };
}
