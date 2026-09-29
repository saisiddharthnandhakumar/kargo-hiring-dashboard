import type { BatchRunRepository } from "../types";
import { getSupabaseClient } from "./client";
import { batchRunFromRow } from "./mappers";

export function createSupabaseBatchRunRepository(): BatchRunRepository {
  const db = getSupabaseClient();

  return {
    async start(totalCount) {
      const { data, error } = await db
        .from("batch_runs")
        .insert({ status: "running", total_count: totalCount })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return batchRunFromRow(data);
    },

    async update(id, patch) {
      const row: Record<string, unknown> = {};
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.totalCount !== undefined) row.total_count = patch.totalCount;
      if (patch.processedCount !== undefined) row.processed_count = patch.processedCount;
      if (patch.succeededCount !== undefined) row.succeeded_count = patch.succeededCount;
      if (patch.failedCount !== undefined) row.failed_count = patch.failedCount;
      if (patch.currentApplicationId !== undefined) row.current_application_id = patch.currentApplicationId;
      if (patch.failures !== undefined) row.failures = patch.failures;
      if (patch.finishedAt !== undefined) row.finished_at = patch.finishedAt;

      const { data, error } = await db.from("batch_runs").update(row).eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return batchRunFromRow(data);
    },

    async getById(id) {
      const { data, error } = await db.from("batch_runs").select().eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? batchRunFromRow(data) : null;
    },

    async getLatest() {
      const { data, error } = await db
        .from("batch_runs")
        .select()
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? batchRunFromRow(data) : null;
    },
  };
}
