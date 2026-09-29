import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const batchRunId = url.searchParams.get("batchRunId");

  const repos = getRepositories();
  const run = batchRunId ? await repos.batchRuns.getById(batchRunId) : await repos.batchRuns.getLatest();

  if (!run) {
    return NextResponse.json({ error: "No batch run found" }, { status: 404 });
  }

  return NextResponse.json(run);
}
