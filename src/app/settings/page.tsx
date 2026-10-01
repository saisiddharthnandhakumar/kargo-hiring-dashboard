import Link from "next/link";
import { TestEmailForm } from "@/components/settings/TestEmailForm";
import { isAiConfigured, getModelId } from "@/lib/ai/provider";
import { getSenderConfig, isResendConfigured, isUsingResendTestSender } from "@/lib/email/config";
import { getRepositories } from "@/lib/repositories";

export const dynamic = "force-dynamic";

function ConfigRow({
  label,
  configured,
  detail,
}: {
  label: string;
  configured: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
      <span
        className={`rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase ${
          configured ? "border-score-high text-score-high" : "border-score-mid text-score-mid"
        }`}
      >
        {configured ? "Configured" : "Demo mode"}
      </span>
    </div>
  );
}

export default async function SettingsPage() {
  const repos = getRepositories();
  const { senderName, senderEmail } = getSenderConfig();
  const resendConfigured = isResendConfigured();
  const aiConfigured = isAiConfigured();
  const recentLogs = await repos.emails.listRecentLogs(20);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/dashboard" className="text-xs text-muted hover:text-foreground">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground">
        Settings
      </h1>
      <p className="mt-1 text-sm text-muted">
        Configuration status for the integrations this app depends on. Everything works in local
        demo mode until you add real keys — nothing here silently starts working differently.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Integrations
        </h2>
        <div className="mt-2">
          <ConfigRow
            label="AI (Google Gemini)"
            configured={aiConfigured}
            detail={aiConfigured ? `Model: ${getModelId()}` : "GOOGLE_GENERATIVE_AI_API_KEY not set"}
          />
          <ConfigRow
            label="Database"
            configured={repos.mode === "neon"}
            detail={
              repos.mode === "neon"
                ? "Neon (Lakebase Postgres)"
                : "Local JSON demo store (seed/.demo-store/db.json)"
            }
          />
          <ConfigRow
            label="Email (Resend)"
            configured={resendConfigured}
            detail={
              !resendConfigured
                ? "RESEND_API_KEY not set — sends are simulated and logged, never actually delivered"
                : isUsingResendTestSender()
                  ? `Sending as ${senderName} <${senderEmail}>. Resend's test sender only delivers to your own Resend account email — set SENDER_EMAIL on a verified domain to email candidates.`
                  : `Sending as ${senderName} <${senderEmail}>`
            }
          />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Test email
        </h2>
        <p className="mt-1 text-xs text-muted">
          Sends (or simulates) a one-off message so you can confirm delivery before relying on it
          for candidates.
        </p>
        <div className="mt-3">
          <TestEmailForm />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Recent email activity
        </h2>
        {recentLogs.length === 0 ? (
          <p className="mt-2 text-xs text-muted">No emails sent yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5 text-xs">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
                <span className="text-foreground">
                  {log.subject} <span className="text-muted">→ {log.to}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Link
                    href={`/candidates/${log.applicationId}`}
                    className="text-muted underline-offset-2 hover:text-foreground hover:underline"
                  >
                    view candidate
                  </Link>
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
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
