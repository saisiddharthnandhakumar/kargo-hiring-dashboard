import type { BriefRepository, InterviewBrief } from "../types";
import { generateId, mutateStore, nowIso, readStore } from "./store";

export function createMemoryBriefRepository(): BriefRepository {
  return {
    async upsert(applicationId, brief) {
      return mutateStore((draft) => {
        const existingIndex = draft.briefs.findIndex((b) => b.applicationId === applicationId);
        const record: InterviewBrief = {
          ...brief,
          id: existingIndex >= 0 ? draft.briefs[existingIndex]!.id : generateId(),
          applicationId,
          createdAt: nowIso(),
        };
        if (existingIndex >= 0) {
          draft.briefs[existingIndex] = record;
        } else {
          draft.briefs.push(record);
        }
        return record;
      });
    },

    async getByApplicationId(applicationId) {
      const store = await readStore();
      return store.briefs.find((b) => b.applicationId === applicationId) ?? null;
    },
  };
}
