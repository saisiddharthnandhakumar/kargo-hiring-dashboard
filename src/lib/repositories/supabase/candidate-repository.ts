import type { CandidateRepository } from "../types";
import { getSupabaseClient } from "./client";
import { candidateFromRow, candidateToRow } from "./mappers";

export function createSupabaseCandidateRepository(): CandidateRepository {
  const db = getSupabaseClient();

  return {
    async create(input) {
      const { data, error } = await db
        .from("candidates")
        .insert(candidateToRow(input))
        .select()
        .single();
      if (error) throw new Error(error.message);
      return candidateFromRow(data);
    },

    async getById(id) {
      const { data, error } = await db.from("candidates").select().eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? candidateFromRow(data) : null;
    },

    async list() {
      const { data, error } = await db.from("candidates").select();
      if (error) throw new Error(error.message);
      return (data ?? []).map(candidateFromRow);
    },
  };
}
