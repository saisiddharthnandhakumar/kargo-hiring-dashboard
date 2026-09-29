import type { BriefRepository } from "../types";
import { getSupabaseClient } from "./client";
import { briefFromRow, briefToRow } from "./mappers";

export function createSupabaseBriefRepository(): BriefRepository {
  const db = getSupabaseClient();

  return {
    async upsert(applicationId, brief) {
      const { data, error } = await db
        .from("interview_briefs")
        .upsert(briefToRow(applicationId, brief), { onConflict: "application_id" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return briefFromRow(data);
    },

    async getByApplicationId(applicationId) {
      const { data, error } = await db
        .from("interview_briefs")
        .select()
        .eq("application_id", applicationId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? briefFromRow(data) : null;
    },
  };
}
