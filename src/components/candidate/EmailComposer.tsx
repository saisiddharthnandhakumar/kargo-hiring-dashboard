"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailDraft, EmailLog, EmailType } from "@/lib/repositories/types";

function latestByType(drafts: EmailDraft[], type: EmailType): EmailDraft | null {
  const matches = drafts
    .filter((d) => d.type === type)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return matches[0] ?? null;
}

export function EmailComposer({
  applicationId,
  candidateEmail,
  initialDrafts,
  initialLogs,
}: {
  applicationId: string;
  candidateEmail: string | null;
  initialDrafts: EmailDraft[];
  initialLogs: EmailLog[];
}) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<EmailType | null>(null);
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentConfirmation, setSentConfirmation] = useState<string | null>(null);

  function loadDraftIntoEditor(d: EmailDraft) {
    setDraft(d);
    setSubject(d.subject);
    setBody(d.body);
  }

  async function selectType(type: EmailType) {
    setActiveType(type);
    setSentConfirmation(null);
    setError(null);
    const existing = latestByType(initialDrafts, type);
    if (existing) {
      loadDraftIntoEditor(existing);
    } else {
      await generate(type);
    }
  }

  async function generate(type: EmailType) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to draft email.");
        return;
      }
      loadDraftIntoEditor(data.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to draft email.");
    } finally {
      setLoading(false);
    }
  }

  async function saveEdits() {
    if (!draft) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/email/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save edits.");
        return;
      }
      setDraft(data.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save edits.");
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!draft) return;
    setLoading(true);
    setError(null);
    setSentConfirmation(null);
    try {
      // Persist any unsaved edits first so what's sent matches what's on screen.
      await saveEdits();
      const res = await fetch(
        `/api/applications/${applicationId}/email/${draft.id}/send`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed.");
        return;
      }
      setDraft(data.draft);
      setLogs((prev) => [data.emailLog, ...prev]);
      setSentConfirmation(
        data.emailLog.status === "simulated"
          ? "Simulated send — no RESEND_API_KEY configured yet, so nothing actually went out. Logged as if it had."
          : `Sent to ${data.emailLog.to}.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
        Email composer
      </h2>
      <p className="mt-1 text-xs text-muted">
        AI drafts. You review, edit, and click Send — nothing goes out on its own.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => selectType("interview_invite")}
          className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeType === "interview_invite"
              ? "border-accent text-accent"
              : "border-border-strong text-foreground hover:bg-surface-hover"
          }`}
        >
          Draft Interview Invite
        </button>
        <button
          type="button"
          onClick={() => selectType("rejection")}
          className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeType === "rejection"
              ? "border-accent text-accent"
              : "border-border-strong text-foreground hover:bg-surface-hover"
          }`}
        >
          Draft Rejection
        </button>
      </div>

      {!candidateEmail && (
        <p className="mt-2 text-xs text-score-mid">
          No email address on file for this candidate — you can still draft and edit, but Send
          will be blocked until one is added.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-score-low">{error}</p>}
      {sentConfirmation && <p className="mt-2 text-xs text-score-high">{sentConfirmation}</p>}

      {activeType && (
        <div className="mt-4 flex flex-col gap-2">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading || draft?.status === "sent"}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground disabled:opacity-60"
            placeholder="Subject"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={loading || draft?.status === "sent"}
            rows={10}
            className="rounded border border-border bg-background px-2 py-1.5 font-mono text-sm text-foreground disabled:opacity-60"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              {draft?.status === "sent" ? "Sent — read only." : "AI-generated draft — review before sending."}
            </span>
            <div className="flex gap-2">
              {draft?.status !== "sent" && (
                <>
                  <button
                    type="button"
                    onClick={() => generate(activeType)}
                    disabled={loading}
                    className="cursor-pointer rounded-md border border-border-strong px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={saveEdits}
                    disabled={loading}
                    className="cursor-pointer rounded-md border border-border-strong px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover disabled:opacity-50"
                  >
                    Save edits
                  </button>
                  <button
                    type="button"
                    onClick={send}
                    disabled={loading || !candidateEmail}
                    title={!candidateEmail ? "No email address on file for this candidate" : undefined}
                    className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:cursor-not-allowed disabled:border disabled:border-border-strong disabled:bg-transparent disabled:text-muted-2"
                  >
                    {loading ? "Sending…" : "Send Email"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <h3 className="text-xs font-medium tracking-wide text-muted uppercase">Delivery log</h3>
          <ul className="mt-1 flex flex-col gap-1 text-xs text-muted">
            {logs.map((log) => (
              <li key={log.id}>
                {new Date(log.sentAt).toLocaleString()} — {log.subject} → {log.to}{" "}
                <span
                  className={
                    log.status === "sent"
                      ? "text-score-high"
                      : log.status === "simulated"
                        ? "text-score-mid"
                        : "text-score-low"
                  }
                >
                  ({log.status})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
