import type { Rubric } from "./types";

/**
 * Product Manager rubric — verbatim from the calibrated hiring rubric
 * (built from 8 past-hire outcomes: 5 Exceeds / 2 Meets / 1 Below).
 * This is the single source of truth for PM scoring. Do not let scoring
 * logic or prompts silently diverge from this text.
 */
export const PM_RUBRIC: Rubric = {
  role: "pm",
  roleTitle: "Product Manager",
  totalWeightLabel: "100%",
  criteria: [
    {
      key: "zero_to_one_ownership",
      name: "Zero-to-One Ownership & Comfort with Ambiguity",
      weight: 0.25,
      description:
        "Built a process, spec format, or team practice themselves because none existed yet — not \"followed the template,\" but \"wrote the template.\" Operated as the only PM, or without a PM function/handbook to lean on. Explicit evidence of deciding what to build with no committee sign-off.",
      anchors: {
        5: "Built a PM function/practice from scratch solo (e.g. first PM at a company, wrote the first PRD template, owned a product area with zero senior-PM layer above them).",
        3: "Contributed to process within an existing, established PM team.",
        1: "All work happened inside a fully built-out process with heavy oversight; no evidence of building anything from zero.",
      },
      redFlag:
        "Candidate's only experience is at large, mature product orgs with dedicated PM ops/enablement functions already in place.",
    },
    {
      key: "logistics_domain_grounding",
      name: "Operational / Logistics Domain Grounding",
      weight: 0.2,
      description:
        "Actually performed freight forwarding, customs documentation, port/terminal ops, carrier coordination, or supply-chain/3PL work — not \"worked with logistics clients as a vendor,\" but did the job itself.",
      anchors: {
        5: "1+ years directly doing freight/logistics/customs/port/carrier operations work (any function, not just PM).",
        3: "Sold to, supported, or built for logistics/supply-chain clients but never did the operational job themselves.",
        1: "No logistics/operations exposure of any kind.",
      },
      note: "Do not require this — the PM JD explicitly says curiosity is sufficient — but score it, since it strongly predicted \"Exceeds\" across every function in the past-hire data, not just PM. For PM specifically, this is a prioritization/tiebreaker signal, never an auto-reject gate.",
    },
    {
      key: "ship_and_kill_decision_discipline",
      name: "Ship-and-Kill Decision Discipline",
      weight: 0.2,
      description:
        "Explicit evidence of killing or de-prioritizing a feature/initiative based on usage data or evidence — not just a list of ships. Can point to a specific \"we stopped doing X because Y\" moment.",
      anchors: {
        5: "Concrete example of shipping something, watching real usage data, and killing/redirecting based on it.",
        3: "Shipped multiple features with clear outcomes, but no explicit kill/de-prioritization story.",
        1: "CV is a list of features shipped with no evidence of judgment calls or evidence-based prioritization.",
      },
    },
    {
      key: "direct_field_customer_discovery",
      name: "Direct Field / Customer Discovery",
      weight: 0.2,
      description:
        "Ran discovery directly with end users doing the actual daily work (not just \"talked to customers\" in the abstract). Evidence of translating field observation into a specific product decision (not just interview counts).",
      anchors: {
        5: "Named, specific discovery work with operational end-users that changed a roadmap or design decision.",
        3: "Generic \"conducted user interviews\" language with an output but no specificity about who or what changed.",
        1: "No discovery evidence, or discovery described as purely internal (stakeholder interviews only, no end users).",
      },
    },
    {
      key: "stakeholder_trust_signal",
      name: "Stakeholder Trust Signal",
      weight: 0.15,
      description:
        "A specific quote, unusually fast promotion, or fast scope expansion that shows others trusted their judgment quickly.",
      anchors: {
        5: "Direct quote from a manager/stakeholder about trust in their judgment, or promotion/scope jump notably faster than typical.",
        3: "Steady, on-schedule promotion/scope growth.",
        1: "No external validation signal present in the CV.",
      },
    },
  ],
  historicalSignalRule: {
    key: "pm_domain_x_ownership",
    label: "Historical high-signal pattern (Domain Grounding + Zero-to-One Ownership)",
    isProxy: true,
    proxyExplanation:
      "The PM rubric has no literal \"Self-Initiated Action\" criterion. Zero-to-One Ownership & Comfort with Ambiguity is the closest applicable match (acting/building without oversight or being assigned), per the rubric's own mapping guidance.",
    criteriaKeys: ["logistics_domain_grounding", "zero_to_one_ownership"],
  },
};
