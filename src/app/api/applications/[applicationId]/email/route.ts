import { NextResponse } from "next/server";
import { draftCandidateEmail, EMAIL_DRAFT_PROMPT_VERSION } from "@/lib/ai/email-draft";
import { COMPANY_NAME, getSenderConfig } from "@/lib/email/config";
import { getRepositories, type EmailType } from "@/lib/repositories";
import { getRubric } from "@/lib/rubric";

export const runtime = "nodejs";
export const maxDuration = 60;

function isEmailType(value: unknown): value is EmailType {
  return value === "interview_invite" || value === "rejection";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  const repos = getRepositories();

  if (isEmailType(type)) {
    const draft = await repos.emails.getLatestDraft(applicationId, type);
    return NextResponse.json({ draft });
  }

  const drafts = await repos.emails.listDraftsForApplication(applicationId);
  return NextResponse.json({ drafts });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const body = await request.json();

  if (!isEmailType(body.type)) {
    return NextResponse.json(
      { error: 'type must be "interview_invite" or "rejection"' },
      { status: 400 },
    );
  }

  const repos = getRepositories();
  const application = await repos.applications.getById(applicationId);
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const [candidate, score] = await Promise.all([
    repos.candidates.getById(application.candidateId),
    repos.scores.getByApplicationId(applicationId),
  ]);
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  const { senderName } = getSenderConfig();

  const result = await draftCandidateEmail({
    type: body.type,
    candidateName: candidate.name,
    roleTitle: getRubric(application.roleKey).roleTitle,
    senderName,
    companyName: COMPANY_NAME,
    highlights: score?.strengths ?? [],
    concerns: score?.concerns ?? [],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const draft = await repos.emails.createDraft({
    applicationId,
    type: body.type,
    subject: result.data.subject,
    body: result.data.body,
    modelId: result.modelId,
    promptVersion: EMAIL_DRAFT_PROMPT_VERSION,
  });

  return NextResponse.json({ draft });
}
