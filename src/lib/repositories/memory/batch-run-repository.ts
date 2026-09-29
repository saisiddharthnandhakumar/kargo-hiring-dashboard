import type { BatchRun, BatchRunRepository } from "../types";
import { generateId, mutateStore, nowIso, readStore } from "./store";

export function createMemoryBatchRunRepository(): BatchRunRepository {
  return {
    async start(totalCount) {
      const run: BatchRun = {
        id: generateId(),
        status: "running",
        totalCount,
        processedCount: 0,
        succeededCount: 0,
        failedCount: 0,
        currentApplicationId: null,
        failures: [],
        startedAt: nowIso(),
        finishedAt: null,
      };
      await mutateStore((draft) => {
        draft.batchRuns.push(run);
      });
      return run;
    },

    async update(id, patch) {
      return mutateStore((draft) => {
        const run = draft.batchRuns.find((r) => r.id === id);
        if (!run) throw new Error(`Batch run not found: ${id}`);
        Object.assign(run, patch);
        return run;
      });
    },

    async getById(id) {
      const store = await readStore();
      return store.batchRuns.find((r) => r.id === id) ?? null;
    },

    async getLatest() {
      const store = await readStore();
      const sorted = [...store.batchRuns].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      return sorted[0] ?? null;
    },
  };
}
