import type { Rubric } from "./types";

/**
 * Senior Product Manager rubric — verbatim from the calibrated hiring rubric
 * (built from 8 past-hire outcomes: 5 Exceeds / 2 Meets / 1 Below).
 * This is the single source of truth for SPM scoring.
 */
export const SPM_RUBRIC: Rubric = {
  role: "spm",
  roleTitle: "Senior Product Manager",
  totalWeightLabel: "100%",
  criteria: [
    {
      key: "complex_integration_systems_ownership",
      name: "Complex / Integration Systems Ownership",
      weight: 0.25,
      description:
        "Owned a technically complex, high-stakes product area (integrations, data layer, platform architecture) with no senior PM layer above them. Decisions with consequences that play out over months/years, not just a sprint.",
      anchors: {
        5: "Sole or lead owner of an integration/data/platform area at a company with real technical complexity, no senior PM oversight.",
        3: "Owned a meaningful but narrower feature area within a larger, supported PM team.",
        1: "No evidence of owning technically complex or architectural decisions independently.",
      },
    },
    {
      key: "logistics_domain_depth",
      name: "Operational / Logistics Domain Depth",
      weight: 0.2,
      description:
        "Same definition as the PM domain-grounding criterion, but requires sustained depth, not a single stint.",
      anchors: {
        5: "2+ years of direct, sustained freight/logistics/supply-chain operational experience.",
        3: "Some exposure (worked adjacent to logistics clients/industry) but not hands-on operational work.",
        1: "No logistics/operations exposure.",
      },
      note: "For SPM, domain grounding can be weighted more heavily as a screen-out signal, since the JD frames it as a \"genuine advantage\" for a role whose main job is judgment calls specific to this operational domain.",
    },
    {
      key: "consequence_bearing_decision_making",
      name: "Consequence-Bearing Decision-Making",
      weight: 0.2,
      description:
        "Build-vs-configure-vs-avoid calls they made and owned. Reliability/uptime ownership, or a post-mortem they personally wrote and drove to resolution (not just participated in).",
      anchors: {
        5: "Named a specific architectural/build-vs-buy decision they made and lived with the outcome of, or authored a post-mortem end to end.",
        3: "Involved in high-stakes decisions but as a contributor, not the final call-maker.",
        1: "No evidence of consequence-bearing decisions.",
      },
    },
    {
      key: "self_initiated_action_under_pressure",
      name: "Self-Initiated Action Under Real Pressure",
      weight: 0.2,
      description:
        "Same definition as the PM zero-to-one criterion (unassigned, solo, real-stakes action) but the bar is higher: the story should involve real technical/business stakes, not just a first feature.",
      anchors: {
        5: "Specific, high-stakes story of solo action with no one asking — and it became the new standard.",
        3: "Some independent action, but within a supported process.",
        1: "All action happens inside existing process with sign-off layers.",
      },
    },
    {
      key: "cross_functional_practice_building",
      name: "Cross-Functional Practice-Building",
      weight: 0.15,
      description:
        "Shaped how the PM function itself works (decision frameworks, review rhythms, standards for good PM work) — not just their own roadmap.",
      anchors: {
        5: "Concrete evidence they built practices/frameworks that other PMs or the org adopted.",
        3: "Followed and executed within existing practices well.",
        1: "No evidence of influence beyond their own individual scope.",
      },
    },
  ],
  historicalSignalRule: {
    key: "spm_domain_x_self_initiated",
    label: "Historical high-signal pattern (Domain Depth + Self-Initiated Action)",
    isProxy: false,
    criteriaKeys: ["logistics_domain_depth", "self_initiated_action_under_pressure"],
  },
};
