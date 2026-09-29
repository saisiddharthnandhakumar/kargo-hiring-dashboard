import { NextResponse } from "next/server";
import { processApplication } from "@/lib/pipeline/process-application";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Runs the full pipeline (extract -> score) for a single NEW or
 * PROCESSING_FAILED application — used by the candidate detail page's
 * "Process now" / "Retry processing" action, distinct from batch and from
 * upload (which calls the same underlying pipeline function directly). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const result = await processApplication(applicationId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ evidence: result.evidence, score: result.score });
}
