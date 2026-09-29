"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TestEmailForm() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; error: string | null } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      setResult({ status: data.status ?? "failed", error: data.error ?? null });
      router.refresh();
    } catch (err) {
      setResult({ status: "failed", error: err instanceof Error ? err.message : "Request failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="text-xs text-muted">Send a test email to</label>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send test email"}
        </button>
      </div>
      {result && (
        <p
          className={`text-xs ${
            result.status === "failed" ? "text-score-low" : "text-score-high"
          }`}
        >
          {result.status === "sent" && "Sent successfully via Resend."}
          {result.status === "simulated" &&
            "Simulated — no RESEND_API_KEY/SENDER_EMAIL configured yet, so nothing actually went out."}
          {result.status === "failed" && `Failed: ${result.error}`}
        </p>
      )}
    </form>
  );
}
