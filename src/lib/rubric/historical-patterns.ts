import type { HistoricalPattern } from "./types";

/**
 * The 3 cross-role patterns found in the 8 past-hire calibration set that
 * neither JD scores for. These are evidence signals for the LLM/founder to
 * weigh, not deterministic pass/fail rules.
 */
export const HISTORICAL_PATTERNS: HistoricalPattern[] = [
  {
    key: "hands_on_logistics_background",
    title: "Hands-on freight/logistics operations background",
    description:
      "Every \"Exceeds\" hire personally did the ground-level operational job (customs documentation, Bills of Lading, port/terminal coordination, carrier/supply-chain ops) before moving into their current function. All three Meets/Below hires have zero logistics exposure (pure HR-tech, fintech, or e-commerce backgrounds). \"Worked with logistics clients\" is NOT equivalent to personally performing logistics operations.",
    whyJdsMissIt:
      "The PM JD only asks for \"genuine curiosity\" about operations; the SPM JD lists domain familiarity as a soft \"advantage,\" buried at the bottom of the requirements list. Neither JD screens for it as a scored, verifiable criterion.",
  },
  {
    key: "specific_high_stakes_initiative",
    title: "A specific, high-stakes story of acting without being asked",
    description:
      "Not a generic \"took initiative\" bullet — an actual moment where the person built or fixed something alone, under real pressure, with nobody telling them to, and it stuck as the new standard (e.g. rebuilding a broken workflow overnight with no manager to consult; resolving a customs crisis solo at 7pm; shipping a weekend prototype that became a core feature). This is a noisier signal than domain grounding (one Meets hire shows partial traces of it) — treat it as directional, not absolute.",
    whyJdsMissIt:
      "Neither JD asks for this directly; \"demonstrated initiative\"-style generic language in a CV should not be read as satisfying it.",
  },
  {
    key: "non_linear_career_pivot",
    title: "A non-linear career pivot into the current function",
    description:
      "Every Exceeds hire changed lanes rather than following one continuous credentialed track (ops exec → engineer, documentation exec → CS, port sales → enterprise SaaS sales, supply chain analyst → PM). The Meets/Below hires each have a single straight-line path (MBA → APM → PM; CS degree → backend engineer only; econ degree → marketing only).",
    whyJdsMissIt: "Neither JD asks about career shape at all.",
  },
];
