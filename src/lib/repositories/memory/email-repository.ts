import type { EmailDraft, EmailLog, EmailRepository } from "../types";
import { generateId, mutateStore, nowIso, readStore } from "./store";

export function createMemoryEmailRepository(): EmailRepository {
  return {
    async createDraft(input) {
      const now = nowIso();
      const draft: EmailDraft = {
        ...input,
        id: generateId(),
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };
      await mutateStore((store) => {
        store.emailDrafts.push(draft);
      });
      return draft;
    },

    async updateDraft(id, patch) {
      return mutateStore((store) => {
        const draft = store.emailDrafts.find((d) => d.id === id);
        if (!draft) throw new Error(`Email draft not found: ${id}`);
        if (patch.subject !== undefined) draft.subject = patch.subject;
        if (patch.body !== undefined) draft.body = patch.body;
        draft.updatedAt = nowIso();
        return draft;
      });
    },

    async getDraftById(id) {
      const store = await readStore();
      return store.emailDrafts.find((d) => d.id === id) ?? null;
    },

    async getLatestDraft(applicationId, type) {
      const store = await readStore();
      const matches = store.emailDrafts
        .filter((d) => d.applicationId === applicationId && d.type === type)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return matches[0] ?? null;
    },

    async listDraftsForApplication(applicationId) {
      const store = await readStore();
      return store.emailDrafts.filter((d) => d.applicationId === applicationId);
    },

    async markSent(id) {
      return mutateStore((store) => {
        const draft = store.emailDrafts.find((d) => d.id === id);
        if (!draft) throw new Error(`Email draft not found: ${id}`);
        draft.status = "sent";
        draft.updatedAt = nowIso();
        return draft;
      });
    },

    async createLog(entry) {
      const log: EmailLog = { ...entry, id: generateId(), sentAt: entry.sentAt ?? nowIso() };
      await mutateStore((store) => {
        store.emailLogs.push(log);
      });
      return log;
    },

    async listLogs(applicationId) {
      const store = await readStore();
      return store.emailLogs
        .filter((l) => l.applicationId === applicationId)
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    },

    async listRecentLogs(limit = 20) {
      const store = await readStore();
      return [...store.emailLogs].sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, limit);
    },
  };
}
