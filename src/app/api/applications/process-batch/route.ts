import { NextResponse } from "next/server";
import { startBatch } from "@/lib/batch/processor";

export const runtime = "nodejs";
export const maxDuration = 800;

export async function POST() {
  const { batchRunId, totalCount } = await startBatch();
  return NextResponse.json({ batchRunId, totalCount }, { status: 202 });
}
