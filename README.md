# Kargo — AI Hiring Dashboard

Decision-support tool for Arjun Mehta (founder, Kargo) to move from CV → evidence → rubric score →
shortlist → interview brief → email, without giving the AI the final call. **The AI recommends,
the founder decides** — nothing scores, rejects, or sends without an explicit click, and every
score is traceable to the exact evidence it came from.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · Vercel AI SDK +
Google Gemini · Zod · Neon (Lakebase Postgres) via `pg` (optional) · Resend (optional)

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
| **Data** | JSON file at `seed/.demo-store/db.json`, gitignored | Neon Postgres — apply `neon/migrations/0001_init.sql` (`npm run migrate:neon`), then set `DATABASE_URL` |
| **Email** | "Sends" are simulated and logged as `simulated` — nothing actually goes out | Real send via Resend — set `RESEND_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME` |
| **AI** | Always live — Google Gemini via `GOOGLE_GENERATIVE_AI_API_KEY` | Same, just point `AI_MODEL_ID` at a different Gemini model if needed |

Check `/settings` at any time to see which mode each integration is actually running in.

Switching from demo to live data is a config change, not a rewrite — every route goes through
the same `Repositories` interface (`src/lib/repositories/types.ts`); which implementation runs
is picked at request time based on whether `DATABASE_URL` is present
(`src/lib/repositories/factory.ts`).

This project is already linked to a live Neon project (`neon link`, `.neon`) and deployed
(`neon deploy`) — see "Deploying to Vercel" below for what that means for hosting.

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
2. **Scoring** (`src/lib/ai/rubric-scoring.ts`): the model scores each of the role's rubric
   criteria on a 1–4 scale (1=Absent, 2=Weak, 3=Present, 4=Strong — see `/rubric`) against that
   evidence, citing exact quotes, conservatively (ambiguous language like "led" or "drove" doesn't
   default to the top score).
3. **Aggregation — the only deterministic step** (`src/lib/scoring/aggregate.ts`, pure TypeScript,
   unit-tested): computes `weightedScore = score × weight` and `overallScore` as their sum, and
   the historical high-signal flag (both mapped criteria at the top score). **The model never
   computes or outputs these — only this one function does**, so a founder overriding a criterion
   score can never accidentally bypass the math either. `SCORE_MIN`/`SCORE_MAX` in that file are
   the single source of truth for the scale — nothing else hardcodes it.
4. The exact rubric text (criteria, weights, anchors, red flags) lives in
   `src/lib/rubric/{pm,spm}.ts`, verbatim from the calibrated rubric — the `/rubric` screen reads
   it directly, so an AI score never hides behind a number you can't check yourself.
5. **Weights are founder-editable** on `/rubric` ("Edit weights" — whole percents, must total
   100%). Saved weights live in the `rubric_weights` table (`neon/migrations/0003_rubric_weights.sql`)
   and override the calibrated defaults above. Saving re-weights every stored score for that role
   in the same transaction via `reweightCriteria` in `aggregate.ts` — pure arithmetic over the
   existing per-criterion scores, no CV is re-read — and new scoring uses the saved weights too.
   "Reset to calibrated" restores the defaults.

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

See `.env.local.example`. Nothing here is required to run the app in demo mode locally —
everything is either already live (Gemini) or falls back gracefully. **Deploying to Vercel is
different** — see below.

## Deploying to Vercel

1. Import the GitHub repo into Vercel.
2. Set these Project → Settings → Environment Variables (Production, and Preview if you want
   preview deploys to work too):

   | Variable | Required? | Where to get it |
   |---|---|---|
   | `GOOGLE_GENERATIVE_AI_API_KEY` | **Required** | [Google AI Studio](https://aistudio.google.com/apikey) |
   | `AI_MODEL_ID` | Optional (defaults to `gemini-flash-latest`) | — |
   | `DATABASE_URL` | **Required** — see note below | Neon project → Connection Details → **pooled** connection string (has `-pooler` in the hostname). This repo is already linked (`neon link`) — run `neon connection-string --pooled` locally to get it, or copy it from the Neon console. |
   | `RESEND_API_KEY` | Optional (sends are simulated without it) | [Resend dashboard](https://resend.com/api-keys) |
   | `SENDER_EMAIL` | Optional | A verified sender/domain in your Resend account |
   | `SENDER_NAME` | Optional | Any display name, e.g. `Arjun Mehta` |

   Not needed at runtime: `DATABASE_URL_UNPOOLED` (only used locally by `npm run migrate:neon`),
   `NEON_BRANCH` (informational only).

3. **`DATABASE_URL` is effectively required on Vercel**, unlike local dev — the "demo mode"
   fallback writes to a JSON file on disk, and Vercel's serverless filesystem doesn't persist
   between invocations (or across the multiple instances Vercel runs concurrently). Without it,
   the dashboard would silently reset/behave inconsistently. The schema is already applied to the
   linked Neon branch (`neon/migrations/0001_init.sql`) — you're just pointing Vercel at the same
   database this was built and tested against.
4. Deploy. First request may cold-start against Neon's scale-to-zero compute (adds a few hundred
   ms) — normal.

**Known limitation on Vercel:** "Process All Applications" (batch) kicks off a background loop
that keeps running after the HTTP response returns (`void runLoop(...)` in
`src/lib/batch/processor.ts`) — this works on a long-lived process (`next dev` / `next start` /
this environment) but a standard Vercel serverless function freezes execution once its response
is sent, which can truncate the batch partway through. Processing CVs one at a time via "Upload
CV" is unaffected (that call is awaited within a single request) and each of those routes now
declares `maxDuration = 60` for the extra headroom two sequential Gemini calls need. If batch
processing on Vercel matters for your workflow, the fix is either Vercel Fluid Compute's
`waitUntil()` (from `@vercel/functions`) around the batch loop, or moving batch processing to a
queue/cron — neither is wired up yet.

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
- Live Resend (fully wired, pending your keys — see "Modes")
- Batch processing on standard Vercel serverless functions — see "Deploying to Vercel" above
- Authentication (single-founder internal tool, no login)
- Automated end-to-end test suite (Playwright) — verified manually in-browser instead
- Storing the original uploaded file (PDF/DOCX bytes) anywhere — only the extracted text is kept;
  Neon Object Storage would be the natural home for this
