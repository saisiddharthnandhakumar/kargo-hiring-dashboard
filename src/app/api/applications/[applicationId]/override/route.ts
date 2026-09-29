import { NextResponse } from "next/server";
import { APPLICATION_STATUSES, getRepositories, type ApplicationStatus } from "@/lib/repositories";
import { isValidRoleKey } from "@/lib/rubric";

export const runtime = "nodejs";

const DEFAULT_ACTOR = "founder";

/**
 * Founder overrides only ever touch status, roleKey, or a single criterion
 * score — never overallScore directly, so the overall score can never
 * bypass lib/scoring/aggregate.ts even under a manual correction. Every
 * override is recorded in the audit log with old/new value and an optional
 * reason; nothing here is ever triggered automatically by the AI.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const body = await request.json();
  const { field, value, criterionKey, reason } = body as {
    field?: string;
    value?: string;
    criterionKey?: string;
    reason?: string;
  };
  const actor = typeof body.actor === "string" && body.actor.trim() ? body.actor : DEFAULT_ACTOR;

  const repos = getRepositories();

  if (field === "status") {
    if (typeof value !== "string" || !APPLICATION_STATUSES.includes(value as ApplicationStatus)) {
      return NextResponse.json({ error: `Invalid status: ${value}` }, { status: 400 });
    }
    const before = await repos.applications.getById(applicationId);
    if (!before) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    const application = await repos.applications.updateStatus(applicationId, value as ApplicationStatus);
    const auditEntry = await repos.audit.append({
      applicationId,
      field: "status",
      oldValue: before.status,
      newValue: value,
      reason: reason ?? null,
      actor,
    });
    return NextResponse.json({ application, auditEntry });
  }

  if (field === "roleKey") {
    if (typeof value !== "string" || !isValidRoleKey(value)) {
      return NextResponse.json({ error: `Invalid roleKey: ${value}` }, { status: 400 });
    }
    const application = await repos.applications.overrideRole(applicationId, value, reason ?? null, actor);
    return NextResponse.json({ application });
  }

  if (field === "criterionScore") {
    const scoreNum = Number(value);
    if (
      typeof criterionKey !== "string" ||
      !Number.isInteger(scoreNum) ||
      scoreNum < 1 ||
      scoreNum > 5
    ) {
      return NextResponse.json(
        { error: "criterionScore override requires a criterionKey and an integer value 1-5" },
        { status: 400 },
      );
    }
    try {
      const score = await repos.scores.applyCriterionOverride(
        applicationId,
        criterionKey,
        scoreNum as 1 | 2 | 3 | 4 | 5,
        reason ?? null,
        actor,
      );
      return NextResponse.json({ score });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json(
    { error: 'field must be "status", "roleKey", or "criterionScore"' },
    { status: 400 },
  );
}
