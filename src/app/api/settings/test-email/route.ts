import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const to = typeof body.to === "string" ? body.to.trim() : "";

  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "Provide a valid email address to test." }, { status: 400 });
  }

  const result = await sendEmail({
    to,
    subject: "Kargo hiring dashboard — test email",
    body: "This is a test email from your Kargo hiring dashboard's Settings page. If you're reading this, Resend is configured correctly.",
  });

  return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
}
