# Kargo — AI Hiring Dashboard

Decision-support tool for Arjun Mehta (founder, Kargo) to move from CV → evidence → rubric score →
shortlist → interview brief → email, without giving the AI the final call. **The AI recommends,
the founder decides** — nothing scores, rejects, or sends without an explicit click, and every
score is traceable to the exact evidence it came from.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · Vercel AI SDK +
Google Gemini · Zod · `@supabase/supabase-js` (optional) · Resend (optional)

## Running it

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`, redirecting to `/dashboard`. **No external services are
required to run this today** — see "Modes" below.

## Modes

This app has two independent "demo vs. live" switches, controlled entirely by environment
variables in `.env.local` (copy `.env.local.example` to start):

| Concern | Demo (default, no keys) | Live (keys set) |
|---|---|---|
| **Data** | JSON file at `seed/.demo-store/db.json`, gitignored | Supabase Postgres — run `supabase/migrations/0001_init.sql` against your project, then set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |
| **Email** | "Sends" are simulated and logged as `simulated` — nothing actually goes out | Real send via Resend — set `RESEND_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME` |
| **AI** | Always live — Google Gemini via `GOOGLE_GENERATIVE_AI_API_KEY` | Same, just point `AI_MODEL_ID` at a different Gemini model if needed |

Check `/settings` at any time to see which mode each integration is actually running in.

Switching from demo to live data is a config change, not a rewrite — every route goes through
the same `Repositories` interface (`src/lib/repositories/types.ts`); which implementation runs
is picked at request time based on whether Supabase env vars are present
(`src/lib/repositories/factory.ts`).

## Processing candidates

- **One CV**: dashboard → pick a role tab → "Upload CV" → choose a PDF/DOCX/TXT file. Extraction
  and scoring run immediately; you'll see the new row once it finishes.
- **All CVs in `seed/applications/`**: dashboard → "Process All Applications". This scans that
  folder plus any previously-failed applications, processes them one at a time (never in
  parallel — see "Known limitations"), and shows live `n/total` progress. One bad CV never stops
  the rest of the batch — it's marked `PROCESSING_FAILED` with the error visible on its detail
  page, and you can retry it individually.
- **The real 60-CV `/applications` folder** wasn't available while this was built. Drop the real
  files into `seed/applications/` (any mix of `.pdf`/`.docx`/`.txt`) and "Process All
  Applications" will pick them up with zero code changes.
- `seed/hires/` (8 real historical hire CVs) and `seed/jds/` (the 2 real job descriptions) are
  already in the repo and are what the rubric, JD text, and demo dashboard data were built and
  tested against.

## How scoring works

1. **Extraction** (`src/lib/ai/evidence-extraction.ts`): the CV text (after
   `src/lib/parsing/pii-strip.ts` removes emails/phones/addresses) goes to Gemini, which returns
   structured evidence — never a score. Missing information comes back as `"Not found in CV"`,
   never invented.
2. **Scoring** (`src/lib/ai/rubric-scoring.ts`): the model scores each of the role's 5 rubric
   criteria 1–5 against that evidence, citing exact quotes, conservatively (ambiguous language
   like "led" or "drove" doesn't default to a 5).
3. **Aggregation — the only deterministic step** (`src/lib/scoring/aggregate.ts`, pure TypeScript,
   unit-tested): computes `weightedScore = score × weight` and `overallScore` as their sum, and
   the historical high-signal flag (both mapped criteria at exactly 5/5). **The model never
   computes or outputs these — only this one function does**, so a founder overriding a criterion
   score can never accidentally bypass the math either.
4. The exact rubric text (weights, anchors, red flags) lives in `src/lib/rubric/{pm,spm}.ts`,
   verbatim from the calibrated rubric — the `/rubric` screen reads it directly, so an AI score
   never hides behind a number you can't check yourself.

Every AI call is versioned (`src/lib/ai/prompts/*`) and stored alongside its output
(`modelId`, `promptVersion`) for auditability. A schema-validation failure retries once, then
routes the application to `PROCESSING_FAILED` with the error visible — it never saves a
partial/invalid record.

## Founder overrides

`POST /api/applications/:id/override` accepts exactly three fields: `status`, `roleKey`, or a
single `criterionScore` — **never** a direct `overallScore` override, so the weighted math always
stays derived. Every override (plus every sent email) is written to an audit log, visible at the
bottom of each candidate's page.

## Environment variables

See `.env.local.example`. Nothing here is required to run the app in demo mode — everything is
either already live (Gemini, via the key configured for this build) or falls back gracefully.

## Testing

```bash
npm test        # unit tests: scoring math, PII stripping, CV extraction (real fixtures)
npm run build   # typecheck + production build
```

`src/lib/scoring/aggregate.test.ts` covers the weighted-math worked example from the rubric spec,
both historical-signal rules (PM proxy, SPM direct), and conservative-failure behavior (missing
criteria, hallucinated keys, out-of-range scores). `src/lib/parsing/*.test.ts` run against the
real seed CVs plus a real generated PDF/TXT fixture (`src/lib/parsing/__fixtures__/`).

## What's outside this MVP

- The actual 60-CV batch run (the `/applications` folder wasn't available while building this —
  see "Processing candidates" above)
- Live Supabase / Resend (both fully wired, pending your keys — see "Modes")
- Authentication (single-founder internal tool, no login)
- Automated end-to-end test suite (Playwright) — verified manually in-browser instead
- A background job queue — batch processing is a sequential in-process loop, which is fine at
  ~60 items but assumes a long-lived Node process (`next dev` / `next start`), not a
  response-lifetime-limited serverless deployment
- Storing the original uploaded file (PDF/DOCX bytes) anywhere — only the extracted text is kept;
  wiring up Supabase Storage for the raw file is a natural next step alongside live Supabase
