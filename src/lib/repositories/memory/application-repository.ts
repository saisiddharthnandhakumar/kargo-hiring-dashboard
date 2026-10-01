import type { Application, ApplicationRepository } from "../types";
import { generateId, mutateStore, nowIso, readStore } from "./store";

export function createMemoryApplicationRepository(): ApplicationRepository {
  return {
    async create(input) {
      const now = nowIso();
      const application: Application = {
        ...input,
        id: generateId(),
        status: "NEW",
        processingError: null,
        createdAt: now,
        updatedAt: now,
      };
      await mutateStore((draft) => {
        draft.applications.push(application);
      });
      return application;
    },

    async getById(id) {
      const store = await readStore();
      return store.applications.find((a) => a.id === id) ?? null;
    },

    async list(filter) {
      const store = await readStore();
      return store.applications.filter((a) => {
        if (filter?.status && a.status !== filter.status) return false;
        if (filter?.roleKey && a.roleKey !== filter.roleKey) return false;
        if (filter?.isCalibration !== undefined && a.isCalibration !== filter.isCalibration) return false;
        return true;
      });
    },

    async listByStatuses(statuses) {
      const store = await readStore();
      return store.applications.filter((a) => statuses.includes(a.status));
    },

    async updateStatus(id, status, processingError = null) {
      return mutateStore((draft) => {
        const application = draft.applications.find((a) => a.id === id);
        if (!application) throw new Error(`Application not found: ${id}`);
        application.status = status;
        application.processingError = processingError;
        application.updatedAt = nowIso();
        return application;
      });
    },

    async overrideRole(id, roleKey, reason, actor) {
      return mutateStore((draft) => {
        const application = draft.applications.find((a) => a.id === id);
        if (!application) throw new Error(`Application not found: ${id}`);
        const oldValue = application.roleKey;
        application.roleKey = roleKey;
        application.roleOverridden = true;
        application.updatedAt = nowIso();
        draft.auditLog.push({
          id: generateId(),
          applicationId: id,
          field: "roleKey",
          oldValue,
          newValue: roleKey,
          reason,
          actor,
          createdAt: nowIso(),
        });
        return application;
      });
    },
  };
}
