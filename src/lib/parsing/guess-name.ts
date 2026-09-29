/**
 * Best-effort fallback for a candidate's display name before AI extraction
 * has run (e.g. right after upload, or in the seed script) — most CVs put
 * the name as the very first non-empty line. The AI evidence-extraction
 * step later provides a more reliable read (`candidate.name`); this is only
 * ever a placeholder until that has run.
 */
export function guessNameFromText(text: string): string {
  const firstLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return firstLine ?? "Unknown candidate";
}
