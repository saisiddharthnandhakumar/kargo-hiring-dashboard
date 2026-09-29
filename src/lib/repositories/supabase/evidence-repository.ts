import type { EvidenceRepository } from "../types";
import { getSupabaseClient } from "./client";
import { evidenceFromRow, evidenceToRow } from "./mappers";

export function createSupabaseEvidenceRepository(): EvidenceRepository {
  const db = getSupabaseClient();

  return {
    async upsert(applicationId, evidence) {
      const { data, error } = await db
        .from("candidate_evidence")
        .upsert(evidenceToRow(applicationId, evidence), { onConflict: "application_id" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return evidenceFromRow(data);
    },

    async getByApplicationId(applicationId) {
      const { data, error } = await db
        .from("candidate_evidence")
        .select()
        .eq("application_id", applicationId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? evidenceFromRow(data) : null;
    },
  };
}
