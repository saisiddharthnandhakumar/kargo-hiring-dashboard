import type { EmailType } from "@/lib/repositories";
import { EmailDraftSchema, type EmailDraftOutput } from "./schemas/email";
import { buildEmailDraftPrompt, EMAIL_DRAFT_PROMPT_VERSION } from "./prompts/email-draft";
import { generateStructured, type StructuredGenerationResult } from "./generate-with-retry";

export { EMAIL_DRAFT_PROMPT_VERSION };

export async function draftCandidateEmail(input: {
  type: EmailType;
  candidateName: string;
  roleTitle: string;
  senderName: string;
  companyName: string;
  highlights: string[];
  concerns: string[];
}): Promise<StructuredGenerationResult<EmailDraftOutput>> {
  const { system, prompt } = buildEmailDraftPrompt(input);
  return generateStructured({ schema: EmailDraftSchema, system, prompt });
}
