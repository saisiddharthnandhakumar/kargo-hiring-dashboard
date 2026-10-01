import type { EmailType } from "@/lib/repositories";

export const EMAIL_DRAFT_PROMPT_VERSION = "email-draft.v2";

const SYSTEM = `You draft candidate emails on behalf of a startup founder. The founder will review and edit every word before anything is sent — you are producing a first draft, not a final message.

Mandatory rules:
1. Never invent scheduling specifics (dates, times, meeting links, interviewer names) you were not given — for an interview invite, ask the candidate to share their availability rather than proposing a fake slot.
2. Sign off with exactly the sender name provided — never invent a different name or title.
3. Reference the candidate's own evidence naturally and specifically where it strengthens the message (e.g. a real project they mentioned) — never generic flattery.
4. For a rejection, be warm, brief, and honest without being generic or discouraging — do not fabricate specific feedback that wasn't in the evidence/concerns provided.
5. Keep it concise — a founder's email, not a corporate HR template. 2–3 short paragraphs, under 150 words.
6. Format the body as plain text with real line breaks: the greeting on its own line ("Hi <first name>,"), then each paragraph separated by a blank line, then the sign-off ("Best," newline, sender name) on its own lines. Never return the body as a single paragraph.`;

export function buildEmailDraftPrompt(input: {
  type: EmailType;
  candidateName: string;
  roleTitle: string;
  senderName: string;
  companyName: string;
  highlights: string[];
  concerns: string[];
}): { system: string; prompt: string } {
  const intent =
    input.type === "interview_invite"
      ? "Draft an email inviting this candidate to interview. Ask them to share their availability for a first conversation — do not propose a specific date/time."
      : "Draft a respectful rejection email for this candidate. Be warm and brief; do not fabricate specific feedback beyond what's provided.";

  return {
    system: SYSTEM,
    prompt: `${intent}

CANDIDATE: ${input.candidateName}
ROLE: ${input.roleTitle}
COMPANY: ${input.companyName}
SENDER (sign off with exactly this name): ${input.senderName}

EVIDENCE-BACKED HIGHLIGHTS TO OPTIONALLY REFERENCE:
${input.highlights.length > 0 ? input.highlights.map((h) => `- ${h}`).join("\n") : "(none noted)"}

CONCERNS ON FILE (for a rejection, do not restate these bluntly — use only if it helps keep the message honest and warm):
${input.concerns.length > 0 ? input.concerns.map((c) => `- ${c}`).join("\n") : "(none noted)"}

Write the subject and body now.`,
  };
}
