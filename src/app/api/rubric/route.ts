import { NextResponse } from "next/server";
import { z } from "zod";
import { HISTORICAL_PATTERNS, getDefaultWeights, getRubric, isValidRoleKey } from "@/lib/rubric";
import { getEffectiveRubric } from "@/lib/rubric/effective";
import { getRepositories } from "@/lib/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");

  if (!role || !isValidRoleKey(role)) {
    return NextResponse.json({ error: 'role must be "pm" or "spm"' }, { status: 400 });
  }

  return NextResponse.json({
    rubric: await getEffectiveRubric(role),
    historicalPatterns: HISTORICAL_PATTERNS,
  });
}

const SaveWeightsSchema = z.object({
  role: z.enum(["pm", "spm"]),
  /** Criterion key → whole-number percent, or null to restore the calibrated defaults. */
  weights: z.record(z.string(), z.number().int().min(0).max(100)).nullable(),
});

/** Saves founder-edited weights for one role and re-weights every stored
 * score against that rubric, so the shortlist reflects them immediately. */
export async function PUT(request: Request) {
  const parsed = SaveWeightsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { role, weights: percents } = parsed.data;

  let weights: Record<string, number> | null = null;
  if (percents) {
    const expectedKeys = getRubric(role).criteria.map((c) => c.key);
    const givenKeys = Object.keys(percents);
    if (givenKeys.length !== expectedKeys.length || !expectedKeys.every((k) => k in percents)) {
      return NextResponse.json(
        { error: `Provide a weight for exactly these criteria: ${expectedKeys.join(", ")}` },
        { status: 400 },
      );
    }
    const total = Object.values(percents).reduce((sum, p) => sum + p, 0);
    if (total !== 100) {
      return NextResponse.json({ error: `Weights must add up to 100% (currently ${total}%)` }, { status: 400 });
    }
    weights = Object.fromEntries(givenKeys.map((k) => [k, percents[k]! / 100]));
  }

  const rescored = await getRepositories().rubricWeights.save(role, weights, getDefaultWeights(role));

  return NextResponse.json({ rubric: await getEffectiveRubric(role), rescored });
}
