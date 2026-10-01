import type { ApplicationRepository } from "../types";
import { getPool } from "./client";
import { applicationFromRow } from "./mappers";

export function createNeonApplicationRepository(): ApplicationRepository {
  const pool = getPool();

  return {
    async create(input) {
      const { rows } = await pool.query(
        `insert into applications (candidate_id, role_key, original_role_key, role_overridden, is_calibration)
         values ($1, $2, $3, $4, $5)
         returning *`,
        [input.candidateId, input.roleKey, input.originalRoleKey, input.roleOverridden, input.isCalibration],
      );
      return applicationFromRow(rows[0]);
    },

    async getById(id) {
      const { rows } = await pool.query("select * from applications where id = $1", [id]);
      return rows[0] ? applicationFromRow(rows[0]) : null;
    },

    async list(filter) {
      const conditions: string[] = [];
      const params: unknown[] = [];
      if (filter?.status) {
        params.push(filter.status);
        conditions.push(`status = $${params.length}`);
      }
      if (filter?.roleKey) {
        params.push(filter.roleKey);
        conditions.push(`role_key = $${params.length}`);
      }
      if (filter?.isCalibration !== undefined) {
        params.push(filter.isCalibration);
        conditions.push(`is_calibration = $${params.length}`);
      }
      const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
      const { rows } = await pool.query(
        `select * from applications ${where} order by created_at desc`,
        params,
      );
      return rows.map(applicationFromRow);
    },

    async listByStatuses(statuses) {
      const { rows } = await pool.query(
        "select * from applications where status = any($1) order by created_at asc",
        [statuses],
      );
      return rows.map(applicationFromRow);
    },

    async updateStatus(id, status, processingError = null) {
      const { rows } = await pool.query(
        `update applications
         set status = $2, processing_error = $3, updated_at = now()
         where id = $1
         returning *`,
        [id, status, processingError],
      );
      if (!rows[0]) throw new Error(`Application not found: ${id}`);
      return applicationFromRow(rows[0]);
    },

    async overrideRole(id, roleKey, reason, actor) {
      const client = await pool.connect();
      try {
        await client.query("begin");

        const { rows: beforeRows } = await client.query(
          "select role_key from applications where id = $1",
          [id],
        );
        if (!beforeRows[0]) throw new Error(`Application not found: ${id}`);
        const oldValue = beforeRows[0].role_key as string;

        const { rows } = await client.query(
          `update applications
           set role_key = $2, role_overridden = true, updated_at = now()
           where id = $1
           returning *`,
          [id, roleKey],
        );

        await client.query(
          `insert into audit_log (application_id, field, old_value, new_value, reason, actor)
           values ($1, 'roleKey', $2, $3, $4, $5)`,
          [id, oldValue, roleKey, reason, actor],
        );

        await client.query("commit");
        return applicationFromRow(rows[0]);
      } catch (err) {
        await client.query("rollback");
        throw err;
      } finally {
        client.release();
      }
    },
  };
}
