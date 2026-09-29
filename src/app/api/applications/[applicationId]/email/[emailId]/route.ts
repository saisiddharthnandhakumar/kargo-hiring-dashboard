import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ emailId: string }> },
) {
  const { emailId } = await params;
  const body = await request.json();

  const patch: { subject?: string; body?: string } = {};
  if (typeof body.subject === "string") patch.subject = body.subject;
  if (typeof body.body === "string") patch.body = body.body;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Provide subject and/or body to update." }, { status: 400 });
  }

  const repos = getRepositories();
  try {
    const draft = await repos.emails.updateDraft(emailId, patch);
    return NextResponse.json({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
