import type { Rubric } from "./types";

/**
 * Product Manager rubric — built from 8 past-hire outcomes
 * (5 Exceeds / 2 Meets / 1 Below). This is the single source of truth for
 * PM scoring. Do not let scoring logic or prompts silently diverge from
 * this text.
 *
 * Scale is 4-point (4=Strong, 3=Present, 2=Weak, 1=Absent). Weights below
 * were rebalanced (scaled down proportionally) after adding
 * loss_institutionalized, so all six still sum to 100%.
 */
export const PM_RUBRIC: Rubric = {
  role: "pm",
  roleTitle: "Product Manager",
  totalWeightLabel: "100%",
  criteria: [
    {
      key: "zero_to_one_ownership",
      name: "Zero-to-One Ownership & Comfort with Ambiguity",
      weight: 0.21,
      description:
        "Built a process, spec format, or team practice themselves because none existed yet — not \"followed the template,\" but \"wrote the template.\" Operated as the only PM, or without a PM function/handbook to lean on. Explicit evidence of deciding what to build with no committee sign-off.",
      anchors: {
        4: "Built a PM function/practice from scratch solo (e.g. first PM at a company, wrote the first PRD template, owned a product area with zero senior-PM layer above them).",
        3: "Contributed to process within an existing, established PM team.",
        2: "Took initiative on a self-contained piece of work without being asked, but it stayed within their own lane — no evidence anyone else adopted it or that it shaped process beyond their own tasks.",
        1: "All work happened inside a fully built-out process with heavy oversight; no evidence of building anything from zero.",
      },
      redFlag:
        "Candidate's only experience is at large, mature product orgs with dedicated PM ops/enablement functions already in place.",
    },
    {
      key: "logistics_domain_grounding",
      name: "Operational / Logistics Domain Grounding",
      weight: 0.17,
      description:
        "Actually performed freight forwarding, customs documentation, port/terminal ops, carrier coordination, or supply-chain/3PL work — not \"worked with logistics clients as a vendor,\" but did the job itself.",
      anchors: {
        4: "1+ years directly doing freight/logistics/customs/port/carrier operations work (any function, not just PM).",
        3: "Sold to, supported, or built for logistics/supply-chain clients but never did the operational job themselves.",
        2: "Adjacent company or team exposure only — worked at or alongside a logistics-adjacent business, but description stays at the company level (\"worked with X\"), never first-person operational language.",
        1: "No logistics/operations exposure of any kind.",
      },
      note: "Do not require this — the PM JD explicitly says curiosity is sufficient — but score it, since it strongly predicted \"Exceeds\" across every function in the past-hire data, not just PM. For PM specifically, this is a prioritization/tiebreaker signal, never an auto-reject gate.",
    },
    {
      key: "ship_and_kill_decision_discipline",
      name: "Ship-and-Kill Decision Discipline",
      weight: 0.17,
      description:
        "Explicit evidence of killing or de-prioritizing a feature/initiative based on usage data or evidence — not just a list of ships. Can point to a specific \"we stopped doing X because Y\" moment.",
      anchors: {
        4: "Concrete example of shipping something, watching real usage data, and killing/redirecting based on it.",
        3: "Shipped multiple features with clear outcomes, but no explicit kill/de-prioritization story.",
        2: "Shipped features with stated outcomes, but no explicit before/after usage-data comparison behind any decision — reads as scheduled deprioritization, not a discrete evidence-driven kill.",
        1: "CV is a list of features shipped with no evidence of judgment calls or evidence-based prioritization.",
      },
    },
    {
      key: "direct_field_customer_discovery",
      name: "Direct Field / Customer Discovery",
      weight: 0.17,
      description:
        "Ran discovery directly with end users doing the actual daily work (not just \"talked to customers\" in the abstract). Evidence of translating field observation into a specific product decision (not just interview counts).",
      anchors: {
        4: "Named, specific discovery work with operational end-users that changed a roadmap or design decision.",
        3: "Generic \"conducted user interviews\" language with an output but no specificity about who or what changed.",
        2: "Mentions discovery activity (calls, visits, surveys) in passing, with no specific finding tied to it — unclear whether it changed anything.",
        1: "No discovery evidence, or discovery described as purely internal (stakeholder interviews only, no end users).",
      },
    },
    {
      key: "stakeholder_trust_signal",
      name: "Stakeholder Trust Signal",
      weight: 0.13,
      description:
        "A specific quote, unusually fast promotion, or fast scope expansion that shows others trusted their judgment quickly.",
      anchors: {
        4: "Direct quote from a manager/stakeholder about trust in their judgment, or promotion/scope jump notably faster than typical.",
        3: "Steady, on-schedule promotion/scope growth.",
        2: "A vague reference to being trusted or well-regarded, with no named person, quote, or measurable timing behind it.",
        1: "No external validation signal present in the CV.",
      },
    },
    {
      key: "loss_institutionalized",
      name: "Loss Institutionalized",
      weight: 0.15,
      description:
        "Explicit evidence that a failure, setback, or postmortem produced something durable that outlived the moment — a named process, doc, or guardrail that other people (not just the candidate) still use. Not just \"we learned from it\" language with nothing to show for it.",
      anchors: {
        4: "Named failure/setback → named artifact (a process, checklist, doc, or guardrail) that is still in active use by others; candidate can point to the specific thing that exists today because of that failure.",
        3: "A failure led to an implied process change (things got done differently afterward), but no specific named artifact — the change is described, not evidenced.",
        2: "Setback is acknowledged as a personal lesson (\"I learned that...\") but produces no described output for anyone besides the candidate.",
        1: "CV reads as a highlights reel only — no failures, setbacks, or postmortems mentioned at all.",
      },
      note: "Added to the calibrated rubric alongside a later founder review deck; not part of the original 8-hire calibration text for the other five criteria.",
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
