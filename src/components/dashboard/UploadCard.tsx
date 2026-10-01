"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import type { RoleKey } from "@/lib/rubric/types";

const ROLE_LABEL: Record<RoleKey, string> = {
  pm: "Product Manager",
  spm: "Senior Product Manager",
};

// Rough timing of the real pipeline (extract → score both rubrics → draft email).
const STAGES = [
  { at: 0, text: "Reading the CV…" },
  { at: 6, text: "Pulling out evidence…" },
  { at: 18, text: "Scoring against PM and SPM rubrics…" },
  { at: 34, text: "Drafting the email…" },
  { at: 50, text: "Almost there…" },
];

export function UploadCard({ role, highlight = false }: { role: RoleKey; highlight?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [targetRole, setTargetRole] = useState<RoleKey>(role);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!highlight) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  useEffect(() => {
    if (!uploading) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [uploading]);

  function pick(f: File | undefined) {
    setError(null);
    setDone(null);
    if (!f) return;
    if (!/\.(pdf|docx|txt)$/i.test(f.name)) {
      setError("Use a PDF, DOCX, or TXT file.");
      return;
    }
    setFile(f);
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setElapsed(0);
    setError(null);
    setDone(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("roleKey", targetRole);
      const res = await fetch("/api/applications/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      if (data.processing && !data.processing.ok) {
        setError(`Uploaded, but scoring failed: ${data.processing.error}`);
      } else {
        setDone(`${data.candidate?.name ?? "Candidate"} is ranked below — email drafted.`);
      }
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      if (targetRole !== role) router.push(`/dashboard?role=${targetRole}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const stage = [...STAGES].reverse().find((s) => elapsed >= s.at)?.text ?? STAGES[0]!.text;

  return (
    <section
      ref={cardRef}
      aria-labelledby="upload-heading"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files[0]);
      }}
      className={`flex flex-col gap-4 rounded-xl border border-dashed p-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        dragging || highlight ? "border-accent bg-accent/5" : "border-border-strong bg-surface/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <FileUp className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <div aria-live="polite">
          <h2 id="upload-heading" className="text-[15px] font-semibold text-foreground">
            {uploading ? stage : file ? file.name : "Got a new CV? Drop it here."}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {uploading
              ? `${elapsed}s — usually under a minute.`
              : done
                ? done
                : "PDF, DOCX or TXT. Ranked against both roles, email drafted for you."}
          </p>
          {error && (
            <p role="alert" className="mt-1 text-sm text-score-low">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="upload-role">
          Applying for
        </label>
        <select
          id="upload-role"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value as RoleKey)}
          disabled={uploading}
          className="min-h-10 rounded-lg border border-border-strong bg-background px-3 text-sm text-foreground"
        >
          {(Object.keys(ROLE_LABEL) as RoleKey[]).map((key) => (
            <option key={key} value={key}>
              {ROLE_LABEL[key]}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {file && !uploading ? (
          <button
            type="button"
            onClick={upload}
            className="min-h-10 cursor-pointer rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Rank this CV
          </button>
        ) : (
          <button
            type="button"
            autoFocus={highlight}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="min-h-10 cursor-pointer rounded-lg bg-[#e8e8e8] px-4 text-sm font-semibold text-[#0b0b0c] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Choose file
          </button>
        )}
      </div>
    </section>
  );
}
