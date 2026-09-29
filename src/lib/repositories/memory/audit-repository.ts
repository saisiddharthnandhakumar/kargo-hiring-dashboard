import type { AuditRepository } from "../types";
import { generateId, mutateStore, nowIso, readStore } from "./store";

export function createMemoryAuditRepository(): AuditRepository {
  return {
    async append(entry) {
      return mutateStore((draft) => {
        const record = { ...entry, id: generateId(), createdAt: nowIso() };
        draft.auditLog.push(record);
        return record;
      });
    },

    async listForApplication(applicationId) {
      const store = await readStore();
      return store.auditLog
        .filter((a) => a.applicationId === applicationId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}
