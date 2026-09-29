import type { AuditRepository } from "../types";
import { getSupabaseClient } from "./client";
import { auditFromRow } from "./mappers";

export function createSupabaseAuditRepository(): AuditRepository {
  const db = getSupabaseClient();

  return {
    async append(entry) {
      const { data, error } = await db
        .from("audit_log")
        .insert({
          application_id: entry.applicationId,
          field: entry.field,
          old_value: entry.oldValue,
          new_value: entry.newValue,
          reason: entry.reason,
          actor: entry.actor,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return auditFromRow(data);
    },

    async listForApplication(applicationId) {
      const { data, error } = await db
        .from("audit_log")
        .select()
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(auditFromRow);
    },
  };
}
