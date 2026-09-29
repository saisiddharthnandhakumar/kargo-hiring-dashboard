import type { AuditRepository } from "../types";
import { getPool } from "./client";
import { auditFromRow } from "./mappers";

export function createNeonAuditRepository(): AuditRepository {
  const pool = getPool();

  return {
    async append(entry) {
      const { rows } = await pool.query(
        `insert into audit_log (application_id, field, old_value, new_value, reason, actor)
         values ($1, $2, $3, $4, $5, $6)
         returning *`,
        [entry.applicationId, entry.field, entry.oldValue, entry.newValue, entry.reason, entry.actor],
      );
      return auditFromRow(rows[0]);
    },

    async listForApplication(applicationId) {
      const { rows } = await pool.query(
        "select * from audit_log where application_id = $1 order by created_at desc",
        [applicationId],
      );
      return rows.map(auditFromRow);
    },
  };
}
