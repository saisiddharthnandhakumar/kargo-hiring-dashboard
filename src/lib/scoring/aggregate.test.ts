import { describe, expect, it } from "vitest";
import { aggregateScore } from "./aggregate";
import { getRubric } from "@/lib/rubric";
import type { CriterionScoreInput } from "./types";

function fullScoreSet(role: "pm" | "spm", overrides: Record<string, number> = {}): CriterionScoreInput[] {
  const rubric = getRubric(role);
  return rubric.criteria.map((c) => ({
    key: c.key,
    score: overrides[c.key] ?? 3,
    rationale: "test rationale",
    evidenceRefs: ["test evidence"],
    confidence: 0.8,
    missingEvidence: null,
  }));
}

describe("aggregateScore — rubric weights", () => {
  it("PM criterion weights sum to 1", () => {
    const total = getRubric("pm").criteria.reduce((s, c) => s + c.weight, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("SPM criterion weights sum to 1", () => {
    const total = getRubric("spm").criteria.reduce((s, c) => s + c.weight, 0);
    expect(total).toBeCloseTo(1, 5);
  });
});

describe("aggregateScore — weighted math", () => {
  it("computes weightedScore = score * weight per criterion, and overallScore as their sum", () => {
    const result = aggregateScore({ role: "pm", criteria: fullScoreSet("pm") });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const c of result.criteria) {
      expect(c.weightedScore).toBeCloseTo(c.score * c.weight, 5);
    }
    // all 3s -> overall should be exactly 3
    expect(result.overallScore).toBeCloseTo(3, 5);
  });

  it("matches the spec's worked example (criterion 1: 4 x 0.25 = 1.00, criterion 2: 5 x 0.20 = 1.00)", () => {
    const result = aggregateScore({
      role: "pm",
      criteria: fullScoreSet("pm", {
        zero_to_one_ownership: 4,
        logistics_domain_grounding: 5,
      }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const c1 = result.criteria.find((c) => c.key === "zero_to_one_ownership")!;
    const c2 = result.criteria.find((c) => c.key === "logistics_domain_grounding")!;
    expect(c1.weightedScore).toBeCloseTo(1.0, 5);
    expect(c2.weightedScore).toBeCloseTo(1.0, 5);
  });

  it("keeps overallScore on a 1-5 scale even at the extremes", () => {
    const allFives = aggregateScore({ role: "spm", criteria: fullScoreSet("spm", Object.fromEntries(getRubric("spm").criteria.map((c) => [c.key, 5])) as Record<string, number>) });
    const allOnes = aggregateScore({ role: "spm", criteria: fullScoreSet("spm", Object.fromEntries(getRubric("spm").criteria.map((c) => [c.key, 1])) as Record<string, number>) });
    expect(allFives.ok && allFives.overallScore).toBe(5);
    expect(allOnes.ok && allOnes.overallScore).toBe(1);
  });
});

describe("aggregateScore — historical high-signal pattern", () => {
  it("PM: triggers only when logistics_domain_grounding AND zero_to_one_ownership are both 5, and is labeled as a proxy", () => {
    const triggered = aggregateScore({
      role: "pm",
      criteria: fullScoreSet("pm", { logistics_domain_grounding: 5, zero_to_one_ownership: 5 }),
    });
    expect(triggered.ok && triggered.historicalSignal.triggered).toBe(true);
    expect(triggered.ok && triggered.historicalSignal.isProxy).toBe(true);

    const notTriggered = aggregateScore({
      role: "pm",
      criteria: fullScoreSet("pm", { logistics_domain_grounding: 5, zero_to_one_ownership: 4 }),
    });
    expect(notTriggered.ok && notTriggered.historicalSignal.triggered).toBe(false);
  });

  it("PM: a non-logistics candidate is not auto-penalized elsewhere — domain grounding at 1 still allows a valid overall score", () => {
    const result = aggregateScore({
      role: "pm",
      criteria: fullScoreSet("pm", { logistics_domain_grounding: 1 }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // overall score is still computed normally; domain grounding is not a screen-out gate for PM
    expect(result.overallScore).toBeGreaterThan(1);
    expect(result.historicalSignal.triggered).toBe(false);
  });

  it("SPM: triggers only when logistics_domain_depth AND self_initiated_action_under_pressure are both 5, and is NOT a proxy", () => {
    const triggered = aggregateScore({
      role: "spm",
      criteria: fullScoreSet("spm", {
        logistics_domain_depth: 5,
        self_initiated_action_under_pressure: 5,
      }),
    });
    expect(triggered.ok && triggered.historicalSignal.triggered).toBe(true);
    expect(triggered.ok && triggered.historicalSignal.isProxy).toBe(false);
  });
});

describe("aggregateScore — validation / conservative-failure behavior", () => {
  it("rejects a non-integer score", () => {
    const result = aggregateScore({
      role: "pm",
      criteria: fullScoreSet("pm", { zero_to_one_ownership: 4.5 }),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a score outside 1-5", () => {
    const result = aggregateScore({
      role: "pm",
      criteria: fullScoreSet("pm", { zero_to_one_ownership: 6 }),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing criterion (fewer than 5)", () => {
    const criteria = fullScoreSet("pm").filter((c) => c.key !== "stakeholder_trust_signal");
    const result = aggregateScore({ role: "pm", criteria });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("stakeholder_trust_signal");
  });

  it("rejects an unknown/hallucinated criterion key", () => {
    const criteria = fullScoreSet("pm");
    const first = criteria[0];
    if (!first) throw new Error("expected at least one criterion in fixture");
    criteria[0] = { ...first, key: "made_up_criterion" };
    const result = aggregateScore({ role: "pm", criteria });
    expect(result.ok).toBe(false);
  });

  it("rejects a duplicate criterion key", () => {
    const criteria = fullScoreSet("pm");
    const first = criteria[0];
    const second = criteria[1];
    if (!first || !second) throw new Error("expected at least two criteria in fixture");
    criteria[1] = { ...second, key: first.key };
    const result = aggregateScore({ role: "pm", criteria });
    expect(result.ok).toBe(false);
  });
});
