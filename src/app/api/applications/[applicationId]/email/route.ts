import { NextResponse } from "next/server";
import { generateEmailDraft } from "@/lib/pipeline/generate-email-draft";
import { getRepositories, type EmailType } from "@/lib/repositories";

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
    repos.scores.getPrimaryByApplicationId(applicationId),
  ]);
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  const result = await generateEmailDraft({
    applicationId,
    type: body.type,
    candidate,
    roleKey: application.roleKey,
    highlights: score?.strengths ?? [],
    concerns: score?.concerns ?? [],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ draft: result.draft });
}
