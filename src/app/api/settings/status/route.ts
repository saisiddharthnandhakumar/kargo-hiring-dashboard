import { NextResponse } from "next/server";
import { isAiConfigured, getModelId } from "@/lib/ai/provider";
import { getSenderConfig, isResendConfigured } from "@/lib/email/config";
import { getRepositories } from "@/lib/repositories";

export const runtime = "nodejs";

export async function GET() {
  const repos = getRepositories();
  const { senderName, senderEmail } = getSenderConfig();

  return NextResponse.json({
    repositoryMode: repos.mode,
    supabaseConfigured: repos.mode === "supabase",
    ai: { configured: isAiConfigured(), modelId: getModelId() },
    email: {
      resendConfigured: isResendConfigured(),
      senderName,
      senderEmail: senderEmail ? maskEmail(senderEmail) : null,
    },
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}
