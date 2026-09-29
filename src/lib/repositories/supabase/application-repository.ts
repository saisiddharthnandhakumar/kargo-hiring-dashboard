import type { ApplicationRepository } from "../types";
import { getSupabaseClient } from "./client";
import { applicationFromRow, applicationToRow } from "./mappers";

export function createSupabaseApplicationRepository(): ApplicationRepository {
  const db = getSupabaseClient();

  return {
    async create(input) {
      const { data, error } = await db
        .from("applications")
        .insert(applicationToRow(input))
        .select()
        .single();
      if (error) throw new Error(error.message);
      return applicationFromRow(data);
    },

    async getById(id) {
      const { data, error } = await db.from("applications").select().eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? applicationFromRow(data) : null;
    },

    async list(filter) {
      let query = db.from("applications").select();
      if (filter?.status) query = query.eq("status", filter.status);
      if (filter?.roleKey) query = query.eq("role_key", filter.roleKey);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map(applicationFromRow);
    },

    async listByStatuses(statuses) {
      const { data, error } = await db.from("applications").select().in("status", statuses);
      if (error) throw new Error(error.message);
      return (data ?? []).map(applicationFromRow);
    },

    async updateStatus(id, status, processingError = null) {
      const { data, error } = await db
        .from("applications")
        .update({ status, processing_error: processingError, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return applicationFromRow(data);
    },

    async overrideRole(id, roleKey, reason, actor) {
      const { data: before, error: beforeError } = await db
        .from("applications")
        .select()
        .eq("id", id)
        .single();
      if (beforeError) throw new Error(beforeError.message);

      const { data, error } = await db
        .from("applications")
        .update({ role_key: roleKey, role_overridden: true, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);

      const { error: auditError } = await db.from("audit_log").insert({
        application_id: id,
        field: "roleKey",
        old_value: before.role_key,
        new_value: roleKey,
        reason,
        actor,
      });
      if (auditError) throw new Error(auditError.message);

      return applicationFromRow(data);
    },
  };
}
