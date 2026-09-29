import type { HistoricalPattern, Rubric } from "@/lib/rubric";
import type { CandidateEvidenceOutput } from "@/lib/ai/schemas/evidence";

export const RUBRIC_SCORING_PROMPT_VERSION = "rubric-scoring.v1";

const SYSTEM = `You are scoring one candidate against Kargo's calibrated hiring rubric for a specific role. You do this ONE criterion at a time in your head, using only the extracted evidence you are given (not the raw CV) — never invent evidence.

Mandatory scoring rules (violating any of these is a failure):
1. Score every criterion using ONLY the anchors provided for it, on the 4-point scale (4=Strong, 3=Present, 2=Weak, 1=Absent). Match the evidence to the closest anchor — do not invent your own scale.
2. BE CONSERVATIVE with ambiguous language. If the evidence says "led product strategy" or "drove the initiative" or "owned the roadmap" without specifics on what they actually built, decided, or changed — do not default to a 4 (Strong). Look for: what they actually owned, whether they were the final decision-maker, what they built, what changed, at what scale, with what consequence, with what measurable outcome. If the evidence only supports a 3 (Present), score a 3.
3. Never award a 4 (Strong) on Operational/Logistics Domain criteria because a company name sounds logistics-related, or because the candidate sold to/supported logistics clients — that is explicitly a 3, not a 4. A 4 requires the candidate personally performed the operational work.
4. The rubric is an OVERLAY on the job description, not a replacement — do not let a rubric criterion override an explicit mandatory JD requirement; if evidence contradicts a hard JD requirement, note it in "concerns."
5. Treat the "historical patterns" below as directional signals to weigh, not deterministic pass/fail rules — do not auto-reject a candidate solely for lacking one.
6. For every criterion, cite the exact evidence you used (evidenceRefs) and note what evidence is missing that would justify a higher score.
7. Every "concerns" and "strengths" entry must be specific and evidence-backed — never generic phrases like "great candidate" or "shows initiative."
8. Interview questions must be tied to this candidate's specific evidence — never generic ("tell me about a time...").
9. Do NOT compute or output an overall score or any weighted total — that is computed deterministically elsewhere. Only output the per-criterion scores.
10. "whySurfaced" must be a tight, evidence-grounded explanation of why this candidate is worth the founder's attention (or isn't) — reference specific evidence, never opaque praise like "great candidate."`;

function renderCriterion(c: Rubric["criteria"][number]): string {
  const lines = [
    `- ${c.name} (key: "${c.key}", weight: ${Math.round(c.weight * 100)}%)`,
    `  What it measures: ${c.description}`,
    `  Score 4 (Strong) anchor: ${c.anchors[4]}`,
    `  Score 3 (Present) anchor: ${c.anchors[3]}`,
    `  Score 2 (Weak) anchor: ${c.anchors[2]}`,
    `  Score 1 (Absent) anchor: ${c.anchors[1]}`,
  ];
  if (c.redFlag) lines.push(`  Red flag: ${c.redFlag}`);
  if (c.note) lines.push(`  Note: ${c.note}`);
  return lines.join("\n");
}

function renderPattern(p: HistoricalPattern): string {
  return `- ${p.title}: ${p.description}`;
}

export function buildRubricScoringPrompt(input: {
  rubric: Rubric;
  jdText: string;
  historicalPatterns: HistoricalPattern[];
  evidence: CandidateEvidenceOutput;
}): { system: string; prompt: string } {
  const criteriaText = input.rubric.criteria.map(renderCriterion).join("\n\n");
  const patternsText = input.historicalPatterns.map(renderPattern).join("\n");

  return {
    system: SYSTEM,
    prompt: `ROLE: ${input.rubric.roleTitle}

JOB DESCRIPTION (the rubric below is an overlay on this, not a replacement):
"""
${input.jdText}
"""

RUBRIC CRITERIA TO SCORE (score exactly these ${input.rubric.criteria.length} keys, no others):

${criteriaText}

HISTORICAL PATTERNS (directional signals only, not scored criteria — weigh them when relevant to strengths/concerns, but do not auto-reject or auto-approve based on them):
${patternsText}

CANDIDATE EVIDENCE (already extracted from the CV; do not re-read a raw CV):
${JSON.stringify(input.evidence, null, 2)}

Score each of the ${input.rubric.criteria.length} criteria now.`,
  };
}
