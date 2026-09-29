import type { EmailRepository } from "../types";
import { getPool } from "./client";
import { emailDraftFromRow, emailLogFromRow } from "./mappers";

export function createNeonEmailRepository(): EmailRepository {
  const pool = getPool();

  return {
    async createDraft(input) {
      const { rows } = await pool.query(
        `insert into email_drafts (application_id, type, subject, body, model_id, prompt_version)
         values ($1, $2, $3, $4, $5, $6)
         returning *`,
        [input.applicationId, input.type, input.subject, input.body, input.modelId, input.promptVersion],
      );
      return emailDraftFromRow(rows[0]);
    },

    async updateDraft(id, patch) {
      const { rows } = await pool.query(
        `update email_drafts
         set subject = coalesce($2, subject), body = coalesce($3, body), updated_at = now()
         where id = $1
         returning *`,
        [id, patch.subject ?? null, patch.body ?? null],
      );
      if (!rows[0]) throw new Error(`Email draft not found: ${id}`);
      return emailDraftFromRow(rows[0]);
    },

    async getDraftById(id) {
      const { rows } = await pool.query("select * from email_drafts where id = $1", [id]);
      return rows[0] ? emailDraftFromRow(rows[0]) : null;
    },

    async getLatestDraft(applicationId, type) {
      const { rows } = await pool.query(
        `select * from email_drafts
         where application_id = $1 and type = $2
         order by created_at desc limit 1`,
        [applicationId, type],
      );
      return rows[0] ? emailDraftFromRow(rows[0]) : null;
    },

    async listDraftsForApplication(applicationId) {
      const { rows } = await pool.query(
        "select * from email_drafts where application_id = $1 order by created_at desc",
        [applicationId],
      );
      return rows.map(emailDraftFromRow);
    },

    async markSent(id) {
      const { rows } = await pool.query(
        `update email_drafts set status = 'sent', updated_at = now() where id = $1 returning *`,
        [id],
      );
      if (!rows[0]) throw new Error(`Email draft not found: ${id}`);
      return emailDraftFromRow(rows[0]);
    },

    async createLog(entry) {
      const { rows } = await pool.query(
        `insert into email_logs
           (email_draft_id, application_id, to_address, subject, resend_message_id, status, error, sent_at)
         values ($1, $2, $3, $4, $5, $6, $7, coalesce($8, now()))
         returning *`,
        [
          entry.emailDraftId,
          entry.applicationId,
          entry.to,
          entry.subject,
          entry.resendMessageId,
          entry.status,
          entry.error,
          entry.sentAt ?? null,
        ],
      );
      return emailLogFromRow(rows[0]);
    },

    async listLogs(applicationId) {
      const { rows } = await pool.query(
        "select * from email_logs where application_id = $1 order by sent_at desc",
        [applicationId],
      );
      return rows.map(emailLogFromRow);
    },

    async listRecentLogs(limit = 20) {
      const { rows } = await pool.query(
        "select * from email_logs order by sent_at desc limit $1",
        [limit],
      );
      return rows.map(emailLogFromRow);
    },
  };
}
