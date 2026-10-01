import { NextResponse } from "next/server";
import { extractText, getSupportedExtension } from "@/lib/parsing/extract-text";
import { extractFirstEmail, extractFirstPhone } from "@/lib/parsing/pii-strip";
import { guessNameFromText } from "@/lib/parsing/guess-name";
import { getRepositories } from "@/lib/repositories";
import { isValidRoleKey } from "@/lib/rubric";
import { processApplication } from "@/lib/pipeline/process-application";

export const runtime = "nodejs";
// Two sequential Gemini calls (extraction + scoring) can take 20-30s+.
// Vercel Hobby caps effective duration at 60s regardless; raise this on Pro/Fluid if needed.
export const maxDuration = 60;

export async function POST(request: Request) {
  const formData = await request.formData();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const roleKeyRaw = formData.get("roleKey");
  if (typeof roleKeyRaw !== "string" || !isValidRoleKey(roleKeyRaw)) {
    return NextResponse.json(
      { error: 'Missing or invalid "roleKey" — must be "pm" or "spm". Role is never guessed silently.' },
      { status: 400 },
    );
  }
  const roleKey = roleKeyRaw;

  if (!getSupportedExtension(file.name)) {
    return NextResponse.json(
      { error: `Unsupported file type for "${file.name}". Supported formats: PDF, DOCX, TXT.` },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let rawText: string;
  try {
    ({ text: rawText } = await extractText(buffer, file.name));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const candidateNameField = formData.get("candidateName");
  const candidateName =
    typeof candidateNameField === "string" && candidateNameField.trim().length > 0
      ? candidateNameField.trim()
      : guessNameFromText(rawText);

  const repos = getRepositories();

  // MVP demo mode stores parsed text only, not the original file bytes — no
  // file-storage bucket is wired up yet (Neon Object Storage would be the
  // natural home for this).
  const resumeFilePath = `uploads/${Date.now()}-${file.name}`;

  const candidate = await repos.candidates.create({
    name: candidateName,
    email: extractFirstEmail(rawText),
    phone: extractFirstPhone(rawText),
    resumeFileName: file.name,
    resumeFilePath,
    resumeMimeType: file.type || "application/octet-stream",
    rawText,
  });

  const application = await repos.applications.create({
    candidateId: candidate.id,
    roleKey,
    originalRoleKey: roleKey,
    roleOverridden: false,
    isCalibration: false,
  });

  const result = await processApplication(application.id);

  return NextResponse.json({
    application: await repos.applications.getById(application.id),
    candidate,
    processing: result.ok ? { ok: true } : { ok: false, error: result.error },
  });
}
