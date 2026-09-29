"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoleKey } from "@/lib/rubric";

interface BatchRunView {
  status: "idle" | "running" | "completed" | "failed";
  totalCount: number;
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  failures: { applicationId: string; fileName: string; error: string }[];
}

export function DashboardActions({ role }: { role: RoleKey }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [batch, setBatch] = useState<BatchRunView | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  async function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const form = e.currentTarget;
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Choose a CV file first.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("roleKey", role);
    const candidateName = (form.elements.namedItem("candidateName") as HTMLInputElement)?.value;
    if (candidateName) formData.set("candidateName", candidateName);

    setUploading(true);
    try {
      const res = await fetch("/api/applications/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      if (data.processing && !data.processing.ok) {
        setUploadError(`Uploaded, but processing failed: ${data.processing.error}`);
      }
      setShowUpload(false);
      form.reset();
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleProcessAll() {
    setBatchError(null);
    try {
      const res = await fetch("/api/applications/process-batch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setBatchError(data.error ?? "Failed to start batch.");
        return;
      }
      if (data.totalCount === 0) {
        setBatch({
          status: "completed",
          totalCount: 0,
          processedCount: 0,
          succeededCount: 0,
          failedCount: 0,
          failures: [],
        });
        return;
      }
      pollBatchStatus(data.batchRunId);
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Failed to start batch.");
    }
  }

  function pollBatchStatus(batchRunId: string) {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/applications/process-batch/status?batchRunId=${batchRunId}`);
      if (!res.ok) return;
      const run: BatchRunView = await res.json();
      setBatch(run);
      if (run.status === "completed" || run.status === "failed") {
        clearInterval(interval);
        router.refresh();
      }
    }, 2000);
  }

  const isBatchRunning = batch !== null && batch.status === "running";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          className="cursor-pointer rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          Upload CV
        </button>
        <button
          type="button"
          onClick={handleProcessAll}
          disabled={isBatchRunning}
          className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBatchRunning
            ? `Processing ${batch.processedCount}/${batch.totalCount}…`
            : "Process All Applications"}
        </button>
      </div>

      {batchError && <p className="text-xs text-score-low">{batchError}</p>}
      {batch && batch.status === "completed" && (
        <p className="text-xs text-muted">
          Batch complete: {batch.succeededCount}/{batch.totalCount} succeeded
          {batch.failedCount > 0 ? `, ${batch.failedCount} failed` : ""}.
        </p>
      )}
      {batch && batch.failures.length > 0 && (
        <ul className="max-w-xs text-right text-xs text-score-low">
          {batch.failures.map((f) => (
            <li key={f.applicationId}>
              {f.fileName}: {f.error}
            </li>
          ))}
        </ul>
      )}

      {showUpload && (
        <div className="absolute top-24 right-6 z-10 w-80 rounded-lg border border-border-strong bg-surface p-4 shadow-xl">
          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Upload CV — {role === "pm" ? "Product Manager" : "Senior Product Manager"}
              </p>
              <p className="mt-0.5 text-xs text-muted">PDF, DOCX, or TXT.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              required
              className="text-xs text-muted file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-surface-2 file:px-2 file:py-1 file:text-xs file:text-foreground"
            />
            <label className="flex flex-col gap-1 text-xs text-muted">
              Candidate name (optional — guessed from the CV otherwise)
              <input
                name="candidateName"
                type="text"
                className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
              />
            </label>
            {uploadError && <p className="text-xs text-score-low">{uploadError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="cursor-pointer rounded-md px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
              >
                {uploading ? "Uploading & processing…" : "Upload & process"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
