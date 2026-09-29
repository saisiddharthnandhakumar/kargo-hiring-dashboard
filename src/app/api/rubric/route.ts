import { NextResponse } from "next/server";
import { HISTORICAL_PATTERNS, getRubric, isValidRoleKey } from "@/lib/rubric";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");

  if (!role || !isValidRoleKey(role)) {
    return NextResponse.json({ error: 'role must be "pm" or "spm"' }, { status: 400 });
  }

  return NextResponse.json({
    rubric: getRubric(role),
    historicalPatterns: HISTORICAL_PATTERNS,
  });
}
