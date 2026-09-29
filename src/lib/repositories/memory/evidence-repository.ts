import type { CandidateEvidence, EvidenceRepository } from "../types";
import { generateId, mutateStore, nowIso, readStore } from "./store";

export function createMemoryEvidenceRepository(): EvidenceRepository {
  return {
    async upsert(applicationId, evidence) {
      return mutateStore((draft) => {
        const existingIndex = draft.evidence.findIndex((e) => e.applicationId === applicationId);
        const record: CandidateEvidence = {
          ...evidence,
          id: existingIndex >= 0 ? draft.evidence[existingIndex]!.id : generateId(),
          applicationId,
          createdAt: nowIso(),
        };
        if (existingIndex >= 0) {
          draft.evidence[existingIndex] = record;
        } else {
          draft.evidence.push(record);
        }
        return record;
      });
    },

    async getByApplicationId(applicationId) {
      const store = await readStore();
      return store.evidence.find((e) => e.applicationId === applicationId) ?? null;
    },
  };
}
