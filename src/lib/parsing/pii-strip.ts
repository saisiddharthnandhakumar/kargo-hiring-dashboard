/**
 * Strips personal/contact identifiers from CV text before it is sent to the
 * AI scoring layer (Components Map: "excludes personal details from AI").
 *
 * This is best-effort, defense-in-depth regex stripping — international
 * phone/address formats will sometimes slip through. It is paired with an
 * explicit prompt instruction (see lib/ai/prompts) telling the model never
 * to echo contact info back into its output. The full, un-stripped text
 * stays in the repository for the app's own use (e.g. emailing the
 * candidate later) — only the copy sent to the model is stripped.
 *
 * Name and current role are deliberately NOT stripped: the AI's own output
 * schema requires candidate.name / candidate.currentRole, and evidence
 * citations need them to stay legible to the founder.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Phone numbers: an optional leading +, then digits grouped with spaces,
// dashes, dots, or parentheses (e.g. "+91 98204 37810", "(022) 4567 8901"),
// totaling multiple groups of 2-5 digits. Deliberately requires at least two
// groups separated by phone-like punctuation so we don't catch a single
// multi-digit metric (e.g. "500000 users") that has no internal separator.
const PHONE_RE =
  /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{2,5}(?:[\s.-]\d{2,5}){1,4}\b/g;

const ADDRESS_LABEL_RE = /^(.*\b(?:address|residence|home address|location)\s*:\s*).*$/gim;

// Indian PIN codes: a standalone 6-digit token immediately preceded or
// followed by a comma/line-end, as in "Mumbai, Maharashtra 400002, India" or
// "...400002" at the end of an address line. Deliberately narrower than a
// bare \b\d{6}\b so a 6-digit *metric* elsewhere in the CV (e.g. "500000
// monthly active users") is left untouched. Best-effort — see file header.
const PIN_CODE_RE = /(?<=,\s*)\b\d{6}\b|\b\d{6}\b(?=\s*[,\n]|\s*$)/gm;

export function stripEmails(text: string): string {
  return text.replace(EMAIL_RE, "[redacted-email]");
}

export function stripPhones(text: string): string {
  return text.replace(PHONE_RE, "[redacted-phone]");
}

export function stripAddressLines(text: string): string {
  return text.replace(ADDRESS_LABEL_RE, "$1[redacted-address]");
}

export function stripPinCodes(text: string): string {
  return text.replace(PIN_CODE_RE, "[redacted-pin]");
}

/** Extracts the first email/phone match for the app's OWN use (e.g. sending
 * the candidate an email later) — never used on the copy of text sent to
 * the AI. `String.prototype.match` with a global regex doesn't mutate or
 * depend on the regex's lastIndex, so reusing these module-level patterns
 * across calls is safe. */
export function extractFirstEmail(text: string): string | null {
  return text.match(EMAIL_RE)?.[0] ?? null;
}

export function extractFirstPhone(text: string): string | null {
  return text.match(PHONE_RE)?.[0]?.trim() ?? null;
}

export function stripPii(text: string): string {
  let result = text;
  result = stripEmails(result);
  result = stripPhones(result);
  result = stripAddressLines(result);
  result = stripPinCodes(result);
  return result;
}
