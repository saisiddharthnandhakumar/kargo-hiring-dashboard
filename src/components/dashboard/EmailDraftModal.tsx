"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCw, Send, X } from "lucide-react";
import type { EmailDraft, EmailType } from "@/lib/repositories/types";

const TYPE_LABEL: Record<EmailType, string> = {
  interview_invite: "Interview invite",
  rejection: "Rejection",
};

function latestOfType(drafts: EmailDraft[], type: EmailType): EmailDraft | null {
  return (
    drafts
      .filter((d) => d.type === type)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

export function EmailDraftModal({
  applicationId,
  candidateName,
  candidateEmail,
  initialType,
  onClose,
}: {
  applicationId: string;
  candidateName: string;
  candidateEmail: string | null;
  initialType: EmailType;
  onClose: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const draftsRef = useRef<EmailDraft[]>([]);
  // Effects run twice in React dev mode; without this guard each open would
  // generate (and store) a duplicate draft.
  const loadStartedRef = useRef(false);

  const [type, setType] = useState<EmailType>(initialType);
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [to, setTo] = useState(candidateEmail ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [phase, setPhase] = useState<"loading" | "writing" | "ready" | "sending" | "sent">("loading");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function show(d: EmailDraft) {
    setDraft(d);
    setSubject(d.subject);
    setBody(d.body);
    setPhase(d.status === "sent" ? "sent" : "ready");
  }

  async function generate(t: EmailType) {
    setPhase("writing");
    setError(null);
    const res = await fetch(`/api/applications/${applicationId}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: t }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Couldn't write the email.");
      setPhase("ready");
      return;
    }
    draftsRef.current = [data.draft, ...draftsRef.current];
    show(data.draft);
  }

  async function load(t: EmailType) {
    setError(null);
    const existing = latestOfType(draftsRef.current, t);
    if (existing) show(existing);
    else await generate(t);
  }

  useEffect(() => {
    if (loadStartedRef.current) return;
    loadStartedRef.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/applications/${applicationId}/email`);
        const data = await res.json();
        draftsRef.current = data.drafts ?? [];
        await load(initialType);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load the email.");
        setPhase("ready");
      }
    })();
    // Load once per open; `load` reads refs, not changing props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, initialType]);

  async function switchType(t: EmailType) {
    if (t === type) return;
    if (phase === "ready" && !(await saveEdits())) return;
    setType(t);
    setNotice(null);
    await load(t);
  }

  function handleClose() {
    // Keep the founder's edits even if they close without sending.
    if (phase === "ready") void saveEdits();
    onClose();
  }

  async function saveEdits(): Promise<boolean> {
    if (!draft) return false;
    if (draft.status === "sent") return true;
    if (subject === draft.subject && body === draft.body) return true;
    const res = await fetch(`/api/applications/${applicationId}/email/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Couldn't save your edits.");
      return false;
    }
    setDraft(data.draft);
    draftsRef.current = draftsRef.current.map((d) => (d.id === data.draft.id ? data.draft : d));
    return true;
  }

  async function send() {
    if (!draft) return;
    setPhase("sending");
    setError(null);
    try {
      if (!(await saveEdits())) {
        setPhase("ready");
        return;
      }
      const res = await fetch(`/api/applications/${applicationId}/email/${draft.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed.");
        setPhase("ready");
        return;
      }
      setDraft(data.draft);
      setPhase("sent");
      setNotice(
        data.emailLog.status === "simulated"
          ? "Logged as sent (simulated — no Resend key configured)."
          : `Sent to ${data.emailLog.to}.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
      setPhase("ready");
    }
  }

  const busy = phase === "loading" || phase === "writing" || phase === "sending";
  const isSent = phase === "sent";
  const canSend = !busy && !isSent && Boolean(draft) && to.trim().length > 0;

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      aria-labelledby="email-modal-title"
      className="m-auto w-[min(42rem,calc(100vw-2rem))] rounded-xl border border-border-strong bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 id="email-modal-title" className="font-[family-name:var(--font-display)] text-xl font-semibold">
            Email {candidateName}
          </h2>
          <p className="mt-0.5 text-xs text-muted">AI draft — edit anything, then send.</p>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
          className="cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4">
        <div role="radiogroup" aria-label="Email type" className="flex gap-1 rounded-lg bg-background p-1">
          {(Object.keys(TYPE_LABEL) as EmailType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              disabled={busy}
              onClick={() => switchType(t)}
              className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                type === t ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 border-b border-border pb-2 text-sm">
          <span className="w-14 shrink-0 text-muted">To</span>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={isSent}
            placeholder="No email found in CV — type one"
            className="flex-1 bg-transparent text-foreground placeholder:text-score-mid focus:outline-none disabled:opacity-70"
          />
        </label>

        {phase === "loading" || phase === "writing" ? (
          <div aria-live="polite" className="flex flex-col gap-2 py-2">
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {phase === "writing" ? "Writing a personalised email…" : "Loading draft…"}
            </p>
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
            <div className="h-24 animate-pulse rounded bg-surface-2" />
          </div>
        ) : (
          <>
            <label className="flex items-center gap-3 border-b border-border pb-2 text-sm">
              <span className="w-14 shrink-0 text-muted">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSent}
                className="flex-1 bg-transparent font-medium text-foreground focus:outline-none disabled:opacity-70"
              />
            </label>
            <textarea
              aria-label="Email body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSent}
              rows={12}
              className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground focus:border-border-strong focus:outline-none disabled:opacity-70"
            />
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-score-low">
            {error}
          </p>
        )}
        {notice && (
          <p aria-live="polite" className="flex items-center gap-1.5 text-sm text-score-high">
            <Check className="h-4 w-4" aria-hidden="true" />
            {notice}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
        {isSent ? (
          <span className="text-sm text-muted">Sent — this email is now read-only.</span>
        ) : (
          <button
            type="button"
            onClick={() => generate(type)}
            disabled={busy}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Rewrite
          </button>
        )}
        {isSent ? (
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 cursor-pointer rounded-lg bg-[#e8e8e8] px-5 text-sm font-semibold text-[#0b0b0c] hover:bg-white"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === "sending" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {phase === "sending" ? "Sending…" : "Send email"}
          </button>
        )}
      </div>
    </dialog>
  );
}
