import { NextResponse } from "next/server";
import { rescoreApplication } from "@/lib/pipeline/process-application";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const result = await rescoreApplication(applicationId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ score: result.score });
}
