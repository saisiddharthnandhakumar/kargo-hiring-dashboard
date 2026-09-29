import type { EmailRepository } from "../types";
import { getSupabaseClient } from "./client";
import { emailDraftFromRow, emailLogFromRow } from "./mappers";

export function createSupabaseEmailRepository(): EmailRepository {
  const db = getSupabaseClient();

  return {
    async createDraft(input) {
      const { data, error } = await db
        .from("email_drafts")
        .insert({
          application_id: input.applicationId,
          type: input.type,
          subject: input.subject,
          body: input.body,
          model_id: input.modelId,
          prompt_version: input.promptVersion,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return emailDraftFromRow(data);
    },

    async updateDraft(id, patch) {
      const { data, error } = await db
        .from("email_drafts")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return emailDraftFromRow(data);
    },

    async getDraftById(id) {
      const { data, error } = await db.from("email_drafts").select().eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? emailDraftFromRow(data) : null;
    },

    async getLatestDraft(applicationId, type) {
      const { data, error } = await db
        .from("email_drafts")
        .select()
        .eq("application_id", applicationId)
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? emailDraftFromRow(data) : null;
    },

    async listDraftsForApplication(applicationId) {
      const { data, error } = await db
        .from("email_drafts")
        .select()
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(emailDraftFromRow);
    },

    async markSent(id) {
      const { data, error } = await db
        .from("email_drafts")
        .update({ status: "sent", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return emailDraftFromRow(data);
    },

    async createLog(entry) {
      const { data, error } = await db
        .from("email_logs")
        .insert({
          email_draft_id: entry.emailDraftId,
          application_id: entry.applicationId,
          to_address: entry.to,
          subject: entry.subject,
          resend_message_id: entry.resendMessageId,
          status: entry.status,
          error: entry.error,
          ...(entry.sentAt ? { sent_at: entry.sentAt } : {}),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return emailLogFromRow(data);
    },

    async listLogs(applicationId) {
      const { data, error } = await db
        .from("email_logs")
        .select()
        .eq("application_id", applicationId)
        .order("sent_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(emailLogFromRow);
    },

    async listRecentLogs(limit = 20) {
      const { data, error } = await db
        .from("email_logs")
        .select()
        .order("sent_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []).map(emailLogFromRow);
    },
  };
}
