import type { EvidenceRepository } from "../types";
import { getPool } from "./client";
import { evidenceFromRow } from "./mappers";

export function createNeonEvidenceRepository(): EvidenceRepository {
  const pool = getPool();

  return {
    async upsert(applicationId, e) {
      const { rows } = await pool.query(
        `insert into candidate_evidence (
           application_id, candidate_name, candidate_current_role_title,
           current_role_evidence, years_experience, companies, education,
           logistics_experience, product_experience, technical_experience,
           ownership_examples, decision_examples, discovery_examples,
           stakeholder_signals, career_transitions, measurable_outcomes,
           raw_evidence, model_id, prompt_version
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         on conflict (application_id) do update set
           candidate_name = excluded.candidate_name,
           candidate_current_role_title = excluded.candidate_current_role_title,
           current_role_evidence = excluded.current_role_evidence,
           years_experience = excluded.years_experience,
           companies = excluded.companies,
           education = excluded.education,
           logistics_experience = excluded.logistics_experience,
           product_experience = excluded.product_experience,
           technical_experience = excluded.technical_experience,
           ownership_examples = excluded.ownership_examples,
           decision_examples = excluded.decision_examples,
           discovery_examples = excluded.discovery_examples,
           stakeholder_signals = excluded.stakeholder_signals,
           career_transitions = excluded.career_transitions,
           measurable_outcomes = excluded.measurable_outcomes,
           raw_evidence = excluded.raw_evidence,
           model_id = excluded.model_id,
           prompt_version = excluded.prompt_version
         returning *`,
        [
          applicationId,
          e.candidateName,
          e.candidateCurrentRoleTitle,
          JSON.stringify(e.currentRole),
          JSON.stringify(e.yearsExperience),
          JSON.stringify(e.companies),
          JSON.stringify(e.education),
          JSON.stringify(e.logisticsExperience),
          JSON.stringify(e.productExperience),
          JSON.stringify(e.technicalExperience),
          JSON.stringify(e.ownershipExamples),
          JSON.stringify(e.decisionExamples),
          JSON.stringify(e.discoveryExamples),
          JSON.stringify(e.stakeholderSignals),
          JSON.stringify(e.careerTransitions),
          JSON.stringify(e.measurableOutcomes),
          e.rawEvidence,
          e.modelId,
          e.promptVersion,
        ],
      );
      return evidenceFromRow(rows[0]);
    },

    async getByApplicationId(applicationId) {
      const { rows } = await pool.query(
        "select * from candidate_evidence where application_id = $1",
        [applicationId],
      );
      return rows[0] ? evidenceFromRow(rows[0]) : null;
    },
  };
}
