import type { BriefRepository } from "../types";
import { getPool } from "./client";
import { briefFromRow } from "./mappers";

export function createNeonBriefRepository(): BriefRepository {
  const pool = getPool();

  return {
    async upsert(applicationId, b) {
      const { rows } = await pool.query(
        `insert into interview_briefs (
           application_id, summary, why_shortlisted, strengths,
           uncertainties, questions, follow_up_probes, model_id, prompt_version
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (application_id) do update set
           summary = excluded.summary,
           why_shortlisted = excluded.why_shortlisted,
           strengths = excluded.strengths,
           uncertainties = excluded.uncertainties,
           questions = excluded.questions,
           follow_up_probes = excluded.follow_up_probes,
           model_id = excluded.model_id,
           prompt_version = excluded.prompt_version
         returning *`,
        [
          applicationId,
          b.summary,
          b.whyShortlisted,
          JSON.stringify(b.strengths),
          JSON.stringify(b.uncertainties),
          JSON.stringify(b.questions),
          JSON.stringify(b.followUpProbes),
          b.modelId,
          b.promptVersion,
        ],
      );
      return briefFromRow(rows[0]);
    },

    async getByApplicationId(applicationId) {
      const { rows } = await pool.query(
        "select * from interview_briefs where application_id = $1",
        [applicationId],
      );
      return rows[0] ? briefFromRow(rows[0]) : null;
    },
  };
}
