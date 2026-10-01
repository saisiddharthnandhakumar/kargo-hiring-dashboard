import type { Candidate, CandidateRepository } from "../types";
import { generateId, mutateStore, nowIso, readStore } from "./store";

export function createMemoryCandidateRepository(): CandidateRepository {
  return {
    async create(input) {
      const candidate: Candidate = { ...input, id: generateId(), createdAt: nowIso() };
      await mutateStore((draft) => {
        draft.candidates.push(candidate);
      });
      return candidate;
    },

    async getById(id) {
      const store = await readStore();
      return store.candidates.find((c) => c.id === id) ?? null;
    },

    async list() {
      const store = await readStore();
      return store.candidates;
    },

    async findByRawText(rawText) {
      const store = await readStore();
      return store.candidates.filter((c) => c.rawText === rawText);
    },

    async updateName(id, name) {
      let updated: Candidate | undefined;
      await mutateStore((draft) => {
        const candidate = draft.candidates.find((c) => c.id === id);
        if (!candidate) throw new Error(`Candidate not found: ${id}`);
        candidate.name = name;
        updated = candidate;
      });
      return updated!;
    },
  };
}
