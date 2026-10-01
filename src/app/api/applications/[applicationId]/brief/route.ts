import { NextResponse } from "next/server";
import { generateInterviewBrief, INTERVIEW_BRIEF_PROMPT_VERSION } from "@/lib/ai/interview-brief";
import { toEvidenceOutput } from "@/lib/ai/evidence-adapter";
import { getRepositories } from "@/lib/repositories";
import { getRubric } from "@/lib/rubric";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const repos = getRepositories();
  const brief = await repos.briefs.getByApplicationId(applicationId);
  return NextResponse.json({ brief });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const repos = getRepositories();

  const application = await repos.applications.getById(applicationId);
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const [candidate, evidence, score] = await Promise.all([
    repos.candidates.getById(application.candidateId),
    repos.evidence.getByApplicationId(applicationId),
    repos.scores.getPrimaryByApplicationId(applicationId),
  ]);

  if (!candidate || !evidence || !score) {
    return NextResponse.json(
      { error: "Application must be processed (evidence + score) before generating a brief." },
      { status: 422 },
    );
  }

  const result = await generateInterviewBrief({
    candidateName: candidate.name,
    roleTitle: getRubric(application.roleKey).roleTitle,
    overallScore: score.overallScore,
    criteria: score.criteria,
    historicalSignal: score.historicalSignal,
    evidence: toEvidenceOutput(evidence),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const brief = await repos.briefs.upsert(applicationId, {
    ...result.data,
    modelId: result.modelId,
    promptVersion: INTERVIEW_BRIEF_PROMPT_VERSION,
  });

  return NextResponse.json({ brief });
}
