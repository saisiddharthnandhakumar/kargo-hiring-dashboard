import type { CandidateEvidenceOutput } from "@/lib/ai/schemas/evidence";
import type { CriterionResult, HistoricalSignalResult } from "@/lib/scoring/types";

export const INTERVIEW_BRIEF_PROMPT_VERSION = "interview-brief.v1";

const SYSTEM = `You are preparing an interview brief for Kargo's founder ahead of a conversation with a shortlisted candidate. Your job is to make the founder faster and sharper in the room, not to repeat the score.

Mandatory rules:
1. Every strength and uncertainty must be grounded in the specific evidence and rationale provided — never generic.
2. Every question must reference a specific claim, project, or number from this candidate's own evidence. Never a generic behavioral question ("tell me about a time you showed initiative").
3. For each question, state what a strong answer would demonstrate and what would weaken confidence — be concrete (e.g. "confirms they made the final call, not just contributed" rather than "shows good judgment").
4. Prioritize questions that validate the criteria with the lowest confidence or the most "missing evidence" — that is where the founder's time in the room is most valuable.
5. followUpProbes are short, open-ended nudges to use if an answer is thin (e.g. "What did you do next?", "Who else was involved in that decision?") — not full questions.`;

export function buildInterviewBriefPrompt(input: {
  candidateName: string;
  roleTitle: string;
  overallScore: number;
  criteria: CriterionResult[];
  historicalSignal: HistoricalSignalResult;
  evidence: CandidateEvidenceOutput;
}): { system: string; prompt: string } {
  const criteriaText = input.criteria
    .map(
      (c) =>
        `- ${c.name} (${c.score}/4, weight ${Math.round(c.weight * 100)}%, confidence ${c.confidence}): ${c.rationale}\n  Evidence: ${c.evidenceRefs.join(" | ")}\n  Missing: ${c.missingEvidence ?? "none noted"}`,
    )
    .join("\n");

  return {
    system: SYSTEM,
    prompt: `CANDIDATE: ${input.candidateName}
ROLE: ${input.roleTitle}
OVERALL SCORE: ${input.overallScore}/4

CRITERION SCORES:
${criteriaText}

HISTORICAL HIGH-SIGNAL PATTERN: ${input.historicalSignal.triggered ? "TRIGGERED" : "not triggered"} (${input.historicalSignal.label}${input.historicalSignal.isProxy ? " — proxy mapping, not a literal rubric criterion" : ""})

FULL EXTRACTED EVIDENCE:
${JSON.stringify(input.evidence, null, 2)}

Produce the interview brief now.`,
  };
}
