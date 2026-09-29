import { SCORE_MAX, SCORE_MIN, clamp, round2 } from "@/lib/scoring/aggregate";
import type { ScoreRepository } from "../types";
import { getPool } from "./client";
import { scoreFromRow } from "./mappers";

export function createNeonScoreRepository(): ScoreRepository {
  const pool = getPool();

  return {
    async upsert(applicationId, s) {
      const { rows } = await pool.query(
        `insert into candidate_scores (
           application_id, overall_score, why_surfaced, criteria,
           historical_signal, strengths, concerns, interview_questions,
           model_id, prompt_version
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (application_id) do update set
           overall_score = excluded.overall_score,
           why_surfaced = excluded.why_surfaced,
           criteria = excluded.criteria,
           historical_signal = excluded.historical_signal,
           strengths = excluded.strengths,
           concerns = excluded.concerns,
           interview_questions = excluded.interview_questions,
           model_id = excluded.model_id,
           prompt_version = excluded.prompt_version
         returning *`,
        [
          applicationId,
          s.overallScore,
          s.whySurfaced,
          JSON.stringify(s.criteria),
          JSON.stringify(s.historicalSignal),
          JSON.stringify(s.strengths),
          JSON.stringify(s.concerns),
          JSON.stringify(s.interviewQuestions),
          s.modelId,
          s.promptVersion,
        ],
      );
      return scoreFromRow(rows[0]);
    },

    async getByApplicationId(applicationId) {
      const { rows } = await pool.query(
        "select * from candidate_scores where application_id = $1",
        [applicationId],
      );
      return rows[0] ? scoreFromRow(rows[0]) : null;
    },

    async applyCriterionOverride(applicationId, criterionKey, newScore, reason, actor) {
      const client = await pool.connect();
      try {
        await client.query("begin");

        const { rows: existingRows } = await client.query(
          "select * from candidate_scores where application_id = $1 for update",
          [applicationId],
        );
        if (!existingRows[0]) {
          throw new Error(`No score to override for application: ${applicationId}`);
        }
        const existing = scoreFromRow(existingRows[0]);

        const criterion = existing.criteria.find((c) => c.key === criterionKey);
        if (!criterion) {
          throw new Error(`Unknown criterion key "${criterionKey}" for this application's score`);
        }

        const oldScore = criterion.score;
        criterion.score = newScore;
        criterion.weightedScore = round2(newScore * criterion.weight);
        existing.overallScore = clamp(
          round2(existing.criteria.reduce((sum, c) => sum + c.weightedScore, 0)),
          SCORE_MIN,
          SCORE_MAX,
        );

        const [keyA, keyB] = existing.historicalSignal.criteriaInvolved;
        const scoreA = existing.criteria.find((c) => c.key === keyA)?.score;
        const scoreB = existing.criteria.find((c) => c.key === keyB)?.score;
        existing.historicalSignal.triggered = scoreA === SCORE_MAX && scoreB === SCORE_MAX;

        const { rows } = await client.query(
          `update candidate_scores
           set criteria = $2, overall_score = $3, historical_signal = $4
           where application_id = $1
           returning *`,
          [
            applicationId,
            JSON.stringify(existing.criteria),
            existing.overallScore,
            JSON.stringify(existing.historicalSignal),
          ],
        );

        await client.query(
          `insert into audit_log (application_id, field, old_value, new_value, reason, actor)
           values ($1, $2, $3, $4, $5, $6)`,
          [applicationId, `criteria.${criterionKey}.score`, String(oldScore), String(newScore), reason, actor],
        );

        await client.query("commit");
        return scoreFromRow(rows[0]);
      } catch (err) {
        await client.query("rollback");
        throw err;
      } finally {
        client.release();
      }
    },
  };
}
