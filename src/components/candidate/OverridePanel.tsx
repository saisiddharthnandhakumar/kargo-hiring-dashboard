"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/repositories/types";
import type { RoleKey } from "@/lib/rubric";

export function OverridePanel({
  applicationId,
  status,
  roleKey,
  hasScore,
}: {
  applicationId: string;
  status: ApplicationStatus;
  roleKey: RoleKey;
  hasScore: boolean;
}) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState<ApplicationStatus>(status);
  const [roleValue, setRoleValue] = useState<RoleKey>(roleKey);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"status" | "role" | "rescore" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function override(field: "status" | "roleKey", value: string) {
    setBusy(field === "status" ? "status" : "role");
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Override failed.");
        return;
      }
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Override failed.");
    } finally {
      setBusy(null);
    }
  }

  async function rescore() {
    setBusy("rescore");
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/rescore`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Re-score failed.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-score failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-foreground">
        Founder controls
      </h3>
      <p className="mt-1 text-xs text-muted">
        The system recommends — nothing here changes automatically. Every override is logged.
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <label className="w-16 shrink-0 text-xs text-muted">Status</label>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value as ApplicationStatus)}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy !== null || statusValue === status}
            onClick={() => override("status", statusValue)}
            className="cursor-pointer rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "status" ? "Saving…" : "Apply"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-16 shrink-0 text-xs text-muted">Role</label>
          <select
            value={roleValue}
            onChange={(e) => setRoleValue(e.target.value as RoleKey)}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
          >
            <option value="pm">Product Manager</option>
            <option value="spm">Senior Product Manager</option>
          </select>
          <button
            type="button"
            disabled={busy !== null || roleValue === roleKey}
            onClick={() => override("roleKey", roleValue)}
            className="cursor-pointer rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "role" ? "Saving…" : "Apply"}
          </button>
        </div>

        <input
          type="text"
          placeholder="Reason for override (optional, applies to next Apply click)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
        />

        {hasScore && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={rescore}
            className="cursor-pointer self-start rounded border border-border-strong px-2 py-1 text-xs text-foreground hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "rescore" ? "Re-scoring…" : "Re-score candidate (uses cached evidence)"}
          </button>
        )}

        {error && <p className="text-xs text-score-low">{error}</p>}
      </div>
    </section>
  );
}
