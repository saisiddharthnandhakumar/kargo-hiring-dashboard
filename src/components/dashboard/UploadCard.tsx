"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileUp, FolderUp, Loader2, Minus, X } from "lucide-react";
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

/** Two CVs in flight at once: each upload is ~4 model calls, so more than
 * this tends to trip the model's per-minute rate limit on a big folder. */
const CONCURRENCY = 2;

const SUPPORTED = /\.(pdf|docx|txt)$/i;

type ItemStatus = "queued" | "ranking" | "done" | "duplicate" | "failed";

interface QueueItem {
  id: string;
  file: File;
  status: ItemStatus;
  message?: string;
}

/** Hidden files (.DS_Store) and Word lock files (~$cv.docx) ride along in
 * most folders — never treat those as CVs. */
function isCv(file: File): boolean {
  return SUPPORTED.test(file.name) && !file.name.startsWith(".") && !file.name.startsWith("~$");
}

/** Content fingerprint, so byte-identical copies inside one folder are
 * caught before upload — two copies in flight at once would otherwise both
 * pass the server's duplicate check and both get processed. */
async function fingerprint(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Walks a dropped folder (any depth) and returns every file inside it. */
async function filesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => (entry as FileSystemFileEntry).file((f) => resolve([f]), () => resolve([])));
  }
  if (!entry.isDirectory) return [];
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const children: FileSystemEntry[] = [];
  // readEntries returns results in batches; keep reading until it's empty.
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve) => reader.readEntries(resolve, () => resolve([])));
    if (batch.length === 0) break;
    children.push(...batch);
  }
  return (await Promise.all(children.map(filesFromEntry))).flat();
}

async function filesFromDrop(dataTransfer: DataTransfer): Promise<File[]> {
  const entries = [...dataTransfer.items]
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => Boolean(e));
  if (entries.length === 0) return [...dataTransfer.files];
  return (await Promise.all(entries.map(filesFromEntry))).flat();
}

function StatusIcon({ status }: { status: ItemStatus }) {
  if (status === "ranking") return <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" aria-hidden="true" />;
  if (status === "done") return <Check className="h-3.5 w-3.5 text-score-high" aria-hidden="true" />;
  if (status === "failed") return <X className="h-3.5 w-3.5 text-score-low" aria-hidden="true" />;
  if (status === "duplicate") return <Minus className="h-3.5 w-3.5 text-muted" aria-hidden="true" />;
  return <span className="block h-1.5 w-1.5 rounded-full bg-muted-2" aria-hidden="true" />;
}

export function UploadCard({ role, highlight = false }: { role: RoleKey; highlight?: boolean }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [targetRole, setTargetRole] = useState<RoleKey>(role);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [ignored, setIgnored] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (!highlight) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    // Leaving mid-batch would abandon every CV still queued.
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", warn);
    };
  }, [running]);

  // folder pickers need a non-standard attribute React doesn't type.
  useEffect(() => {
    folderInputRef.current?.setAttribute("webkitdirectory", "");
  }, []);

  async function pick(files: File[]) {
    setError(null);
    setHasRun(false);
    const cvs = files.filter(isCv);
    setIgnored(files.length - cvs.length);
    if (cvs.length === 0) {
      setQueue([]);
      setError(files.length > 0 ? "No PDF, DOCX or TXT files found." : null);
      return;
    }
    const firstByHash = new Map<string, string>();
    const items: QueueItem[] = [];
    for (const [i, file] of cvs.entries()) {
      const hash = await fingerprint(file);
      const original = firstByHash.get(hash);
      if (original) {
        items.push({
          id: `${i}-${file.name}`,
          file,
          status: "duplicate",
          message: `Same file as ${original} — not processed`,
        });
      } else {
        firstByHash.set(hash, file.name);
        items.push({ id: `${i}-${file.name}`, file, status: "queued" });
      }
    }
    setQueue(items);
  }

  function resetInputs() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  }

  function update(id: string, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function uploadOne(item: QueueItem): Promise<void> {
    update(item.id, { status: "ranking" });
    try {
      const formData = new FormData();
      formData.set("file", item.file);
      formData.set("roleKey", targetRole);
      const res = await fetch("/api/applications/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        update(item.id, {
          status: "duplicate",
          message: data.duplicate
            ? `Duplicate of ${data.duplicate.candidateName} (${data.duplicate.reason}) — not processed`
            : (data.error ?? "Already on the shortlist — not processed"),
        });
      } else if (!res.ok) {
        update(item.id, { status: "failed", message: data.error ?? `Upload failed (${res.status})` });
      } else if (data.processing && !data.processing.ok) {
        update(item.id, { status: "failed", message: `Scoring failed: ${data.processing.error}` });
      } else {
        update(item.id, { status: "done", message: data.candidate?.name ?? "Ranked" });
      }
    } catch (err) {
      update(item.id, { status: "failed", message: err instanceof Error ? err.message : "Upload failed" });
    }
    // Show each candidate on the shortlist as soon as they're ranked.
    if (targetRole === role) router.refresh();
  }

  async function run() {
    const pending = queue.filter((i) => i.status === "queued" || i.status === "failed");
    if (pending.length === 0) return;
    setRunning(true);
    setHasRun(true);
    setElapsed(0);
    setError(null);
    let next = 0;
    const worker = async () => {
      while (next < pending.length) {
        await uploadOne(pending[next++]!);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
    setRunning(false);
    resetInputs();
    if (targetRole !== role) router.push(`/dashboard?role=${targetRole}`);
    router.refresh();
  }

  function clear() {
    setHasRun(false);
    setQueue([]);
    setIgnored(0);
    setError(null);
    resetInputs();
  }

  const total = queue.length;
  const counts = {
    done: queue.filter((i) => i.status === "done").length,
    duplicate: queue.filter((i) => i.status === "duplicate").length,
    failed: queue.filter((i) => i.status === "failed").length,
    queued: queue.filter((i) => i.status === "queued").length,
  };
  const finished = counts.done + counts.duplicate + counts.failed;
  const isBatch = total > 1;
  // "Settled" only once something actually ran — a fresh pick where every
  // file is an in-folder duplicate still shows the ready state.
  const allSettled = total > 0 && !running && counts.queued === 0 && hasRun;
  const retryable = counts.failed > 0 && allSettled;
  const stage = [...STAGES].reverse().find((s) => elapsed >= s.at)?.text ?? STAGES[0]!.text;

  let heading: string;
  let sub: string;
  if (running) {
    heading = isBatch ? `Ranking CVs — ${finished} of ${total} done` : stage;
    sub = isBatch
      ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s elapsed · ${CONCURRENCY} at a time · keep this tab open.`
      : `${elapsed}s — usually under a minute.`;
  } else if (allSettled) {
    heading = isBatch ? `Finished — ${counts.done} of ${total} ranked` : queue[0]!.status === "done" ? "Ranked" : "Not ranked";
    sub = [
      counts.done > 0 && `${counts.done} ranked, email drafted`,
      counts.duplicate > 0 && `${counts.duplicate} duplicate${counts.duplicate === 1 ? "" : "s"} skipped`,
      counts.failed > 0 && `${counts.failed} failed`,
    ]
      .filter(Boolean)
      .join(" · ");
  } else if (total > 0) {
    heading = isBatch ? `${counts.queued} CVs ready` : queue[0]!.file.name;
    sub =
      [
        counts.duplicate > 0 && `${counts.duplicate} duplicate${counts.duplicate === 1 ? "" : "s"} in this folder will be skipped`,
        ignored > 0 && `${ignored} other file${ignored === 1 ? "" : "s"} ignored (not PDF, DOCX or TXT)`,
      ]
        .filter(Boolean)
        .join(" · ") || "Ready to rank. Anyone already on the shortlist is skipped automatically.";
  } else {
    heading = "Got new CVs? Drop a file or a whole folder here.";
    sub = "PDF, DOCX or TXT. Ranked against both roles, email drafted for you.";
  }

  return (
    <section
      ref={cardRef}
      aria-labelledby="upload-heading"
      onDragOver={(e) => {
        e.preventDefault();
        if (!running) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragging(false);
        if (running) return;
        pick(await filesFromDrop(e.dataTransfer));
      }}
      className={`rounded-xl border border-dashed p-5 transition-colors ${
        dragging || highlight ? "border-accent bg-accent/5" : "border-border-strong bg-surface/60"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent">
            {running ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : isBatch ? (
              <FolderUp className="h-5 w-5" aria-hidden="true" />
            ) : (
              <FileUp className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div aria-live="polite" className="min-w-0">
            <h2 id="upload-heading" className="text-[15px] font-semibold break-words text-foreground">
              {heading}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{sub}</p>
            {!isBatch && allSettled && queue[0]!.status !== "done" && queue[0]!.message && (
              <p role="alert" className="mt-1 text-sm text-score-low">
                {queue[0]!.message}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-1 text-sm text-score-low">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
          <label className="sr-only" htmlFor="upload-role">
            Applying for
          </label>
          <select
            id="upload-role"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as RoleKey)}
            disabled={running}
            className="min-h-10 rounded-lg border border-border-strong bg-background px-3 text-sm text-foreground"
          >
            {(Object.keys(ROLE_LABEL) as RoleKey[]).map((key) => (
              <option key={key} value={key}>
                {ROLE_LABEL[key]}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => pick([...(e.target.files ?? [])])}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => pick([...(e.target.files ?? [])])}
          />

          {total > 0 && !running && !allSettled ? (
            <>
              <button
                type="button"
                onClick={clear}
                className="min-h-10 cursor-pointer rounded-lg px-3 text-sm text-muted hover:text-foreground"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={run}
                className="min-h-10 cursor-pointer rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
              >
                {isBatch ? `Rank ${counts.queued} CVs` : "Rank this CV"}
              </button>
            </>
          ) : (
            <>
              {retryable && (
                <button
                  type="button"
                  onClick={run}
                  className="min-h-10 cursor-pointer rounded-lg border border-border-strong px-3.5 text-sm font-medium text-foreground hover:bg-surface-hover"
                >
                  Retry {counts.failed} failed
                </button>
              )}
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={running}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-3.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FolderUp className="h-4 w-4" aria-hidden="true" />
                Choose folder
              </button>
              <button
                type="button"
                autoFocus={highlight}
                onClick={() => fileInputRef.current?.click()}
                disabled={running}
                className="min-h-10 cursor-pointer rounded-lg bg-[#e8e8e8] px-4 text-sm font-semibold text-[#0b0b0c] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Choose files
              </button>
            </>
          )}
        </div>
      </div>

      {isBatch && (
        <>
          <div
            hidden={!hasRun}
            className="mt-4 h-1 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={finished}
            aria-label="CVs processed"
          >
            <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${(finished / total) * 100}%` }} />
          </div>
          <ul className="mt-3 max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border bg-background/40 text-sm">
            {queue.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <StatusIcon status={item.status} />
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">{item.file.name}</span>
                <span
                  className={`max-w-[50%] truncate text-xs ${
                    item.status === "failed"
                      ? "text-score-low"
                      : item.status === "done"
                        ? "text-score-high"
                        : "text-muted"
                  }`}
                  title={item.message}
                >
                  {item.status === "queued" ? "Queued" : item.status === "ranking" ? "Ranking…" : item.message}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
