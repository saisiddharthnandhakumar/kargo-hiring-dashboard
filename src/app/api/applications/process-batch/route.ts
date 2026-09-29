import { NextResponse } from "next/server";
import { startBatch } from "@/lib/batch/processor";

export const runtime = "nodejs";
// 300 is the Vercel Hobby-plan ceiling for maxDuration; raise this if the
// project is on Pro/Enterprise. This route returns almost immediately
// anyway (see the "Known limitation on Vercel" note below) — the real
// batch loop runs after the response, so this bound mostly matters for
// non-Vercel long-lived-process deployments (next start, this environment).
export const maxDuration = 300;

export async function POST() {
  const { batchRunId, totalCount } = await startBatch();
  return NextResponse.json({ batchRunId, totalCount }, { status: 202 });
}
