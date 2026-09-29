import type { CandidateRepository } from "../types";
import { getPool } from "./client";
import { candidateFromRow } from "./mappers";

export function createNeonCandidateRepository(): CandidateRepository {
  const pool = getPool();

  return {
    async create(input) {
      const { rows } = await pool.query(
        `insert into candidates
           (name, email, phone, resume_file_name, resume_file_path, resume_mime_type, raw_text)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning *`,
        [
          input.name,
          input.email,
          input.phone,
          input.resumeFileName,
          input.resumeFilePath,
          input.resumeMimeType,
          input.rawText,
        ],
      );
      return candidateFromRow(rows[0]);
    },

    async getById(id) {
      const { rows } = await pool.query("select * from candidates where id = $1", [id]);
      return rows[0] ? candidateFromRow(rows[0]) : null;
    },

    async list() {
      const { rows } = await pool.query("select * from candidates order by created_at desc");
      return rows.map(candidateFromRow);
    },

    async updateName(id, name) {
      const { rows } = await pool.query(
        "update candidates set name = $2 where id = $1 returning *",
        [id, name],
      );
      return candidateFromRow(rows[0]);
    },
  };
}
