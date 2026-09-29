import { clamp, round2 } from "@/lib/scoring/aggregate";
import type { ScoreRepository } from "../types";
import { getSupabaseClient } from "./client";
import { scoreFromRow, scoreToRow } from "./mappers";

export function createSupabaseScoreRepository(): ScoreRepository {
  const db = getSupabaseClient();

  return {
    async upsert(applicationId, score) {
      const { data, error } = await db
        .from("candidate_scores")
        .upsert(scoreToRow(applicationId, score), { onConflict: "application_id" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return scoreFromRow(data);
    },

    async getByApplicationId(applicationId) {
      const { data, error } = await db
        .from("candidate_scores")
        .select()
        .eq("application_id", applicationId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? scoreFromRow(data) : null;
    },

    async applyCriterionOverride(applicationId, criterionKey, newScore, reason, actor) {
      const { data: existingRow, error: fetchError } = await db
        .from("candidate_scores")
        .select()
        .eq("application_id", applicationId)
        .maybeSingle();
      if (fetchError) throw new Error(fetchError.message);
      if (!existingRow) throw new Error(`No score to override for application: ${applicationId}`);

      const existing = scoreFromRow(existingRow);
      const criterion = existing.criteria.find((c) => c.key === criterionKey);
      if (!criterion) {
        throw new Error(`Unknown criterion key "${criterionKey}" for this application's score`);
      }

      const oldScore = criterion.score;
      criterion.score = newScore;
      criterion.weightedScore = round2(newScore * criterion.weight);
      existing.overallScore = clamp(
        round2(existing.criteria.reduce((sum, c) => sum + c.weightedScore, 0)),
        1,
        5,
      );

      const [keyA, keyB] = existing.historicalSignal.criteriaInvolved;
      const scoreA = existing.criteria.find((c) => c.key === keyA)?.score;
      const scoreB = existing.criteria.find((c) => c.key === keyB)?.score;
      existing.historicalSignal.triggered = scoreA === 5 && scoreB === 5;

      const { data, error } = await db
        .from("candidate_scores")
        .update({
          criteria: existing.criteria,
          overall_score: existing.overallScore,
          historical_signal: existing.historicalSignal,
        })
        .eq("application_id", applicationId)
        .select()
        .single();
      if (error) throw new Error(error.message);

      const { error: auditError } = await db.from("audit_log").insert({
        application_id: applicationId,
        field: `criteria.${criterionKey}.score`,
        old_value: String(oldScore),
        new_value: String(newScore),
        reason,
        actor,
      });
      if (auditError) throw new Error(auditError.message);

      return scoreFromRow(data);
    },
  };
}
