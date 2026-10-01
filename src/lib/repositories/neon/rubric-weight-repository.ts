import { reweightCriteria } from "@/lib/scoring/aggregate";
import type { RubricWeightRepository, RubricWeights } from "../types";
import { getPool } from "./client";
import { scoreFromRow } from "./mappers";

export function createNeonRubricWeightRepository(): RubricWeightRepository {
  const pool = getPool();

  return {
    async get(roleKey) {
      const { rows } = await pool.query(
        "select criterion_key, weight from rubric_weights where role_key = $1",
        [roleKey],
      );
      if (rows.length === 0) return null;
      const weights: RubricWeights = {};
      for (const row of rows) weights[row.criterion_key] = Number(row.weight);
      return weights;
    },

    async save(roleKey, weights, defaults) {
      const client = await pool.connect();
      try {
        await client.query("begin");

        // Set-based statements throughout: one round trip each, however
        // many criteria or scores there are.
        await client.query("delete from rubric_weights where role_key = $1", [roleKey]);
        if (weights) {
          await client.query(
            `insert into rubric_weights (role_key, criterion_key, weight)
             select $1, k, w from unnest($2::text[], $3::numeric[]) as t(k, w)`,
            [roleKey, Object.keys(weights), Object.values(weights)],
          );
        }

        const effective = weights ?? defaults;
        const { rows } = await client.query(
          "select * from candidate_scores where role_key = $1 for update",
          [roleKey],
        );
        const updates = rows.map((row) => {
          const score = scoreFromRow(row);
          return { id: score.id, ...reweightCriteria(score.criteria, effective) };
        });
        if (updates.length > 0) {
          await client.query(
            `update candidate_scores cs
             set criteria = u.criteria, overall_score = u.overall_score
             from unnest($1::uuid[], $2::jsonb[], $3::numeric[]) as u(id, criteria, overall_score)
             where cs.id = u.id`,
            [
              updates.map((u) => u.id),
              updates.map((u) => JSON.stringify(u.criteria)),
              updates.map((u) => u.overallScore),
            ],
          );
        }

        await client.query("commit");
        return rows.length;
      } catch (err) {
        await client.query("rollback");
        throw err;
      } finally {
        client.release();
      }
    },
  };
}
