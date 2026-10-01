"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface BatchRunView {
  status: "idle" | "running" | "completed" | "failed";
  totalCount: number;
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  failures: { applicationId: string; fileName: string; error: string }[];
}

/** Re-runs scoring for any application that's still NEW or failed processing. */
export function DashboardActions() {
  const router = useRouter();
  const [batch, setBatch] = useState<BatchRunView | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleProcessAll() {
    setMessage(null);
    try {
      const res = await fetch("/api/applications/process-batch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Couldn't start.");
        return;
      }
      if (data.totalCount === 0) {
        setMessage("Nothing pending.");
        return;
      }
      pollBatchStatus(data.batchRunId);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Couldn't start.");
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
        setMessage(
          `${run.succeededCount}/${run.totalCount} scored${run.failedCount > 0 ? `, ${run.failedCount} failed` : ""}.`,
        );
        router.refresh();
      }
    }, 2000);
  }

  const running = batch?.status === "running";

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span aria-live="polite" className="text-xs text-muted">
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={handleProcessAll}
        disabled={running}
        title="Score any CVs that are still pending or failed"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} aria-hidden="true" />
        {running ? `Scoring ${batch.processedCount}/${batch.totalCount}…` : "Retry pending"}
      </button>
    </div>
  );
}
