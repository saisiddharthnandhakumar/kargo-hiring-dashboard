import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";
import { getRepositories } from "@/lib/repositories";

export const runtime = "nodejs";

/**
 * The only route in the app that actually dispatches an email. It is only
 * ever reached by an explicit founder click in the UI — nothing upstream
 * (scoring, batch processing, brief generation) calls this on its own.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string; emailId: string }> },
) {
  const { applicationId, emailId } = await params;
  const repos = getRepositories();

  const draft = await repos.emails.getDraftById(emailId);
  if (!draft || draft.applicationId !== applicationId) {
    return NextResponse.json({ error: "Email draft not found" }, { status: 404 });
  }

  const application = await repos.applications.getById(applicationId);
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const candidate = await repos.candidates.getById(application.candidateId);
  if (!candidate?.email) {
    return NextResponse.json(
      { error: "This candidate has no email address on file — cannot send." },
      { status: 400 },
    );
  }

  const sendResult = await sendEmail({
    to: candidate.email,
    subject: draft.subject,
    body: draft.body,
  });

  const emailLog = await repos.emails.createLog({
    emailDraftId: draft.id,
    applicationId,
    to: candidate.email,
    subject: draft.subject,
    resendMessageId: sendResult.resendMessageId,
    status: sendResult.status,
    error: sendResult.error,
  });

  if (sendResult.status === "failed") {
    return NextResponse.json({ emailLog, draft }, { status: 502 });
  }

  const updatedDraft = await repos.emails.markSent(draft.id);
  const newStatus = draft.type === "interview_invite" ? "INTERVIEW" : "REJECTED";
  const updatedApplication = await repos.applications.updateStatus(applicationId, newStatus);
  await repos.audit.append({
    applicationId,
    field: "status",
    oldValue: application.status,
    newValue: newStatus,
    reason: `${draft.type === "interview_invite" ? "Interview invite" : "Rejection"} email sent`,
    actor: "founder",
  });

  return NextResponse.json({ emailLog, draft: updatedDraft, application: updatedApplication });
}
