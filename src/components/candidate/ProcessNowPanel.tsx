"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProcessNowPanel({
  applicationId,
  processingError,
}: {
  applicationId: string;
  processingError: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(processingError);

  async function process() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/process`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Processing failed.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-dashed border-border-strong bg-surface p-6 text-center">
      <p className="text-sm text-muted">
        {processingError
          ? "Processing failed for this candidate. You can retry."
          : "This candidate hasn't been processed yet — no evidence or score exists."}
      </p>
      {error && <p className="mt-2 text-xs text-score-low">{error}</p>}
      <button
        type="button"
        onClick={process}
        disabled={loading}
        className="mt-3 cursor-pointer rounded-md bg-accent px-4 py-2 text-xs font-medium text-accent-foreground disabled:opacity-50"
      >
        {loading ? "Processing…" : processingError ? "Retry processing" : "Process now"}
      </button>
    </section>
  );
}
