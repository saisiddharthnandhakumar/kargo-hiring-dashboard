/**
 * Loads the real historical-hire CVs (seed/hires/*.docx) into the demo data
 * store as stand-in Candidates/Applications, so the dashboard and — once
 * Milestone 3 wires up the AI pipeline — the scoring engine have real data
 * to work against before the actual 60-CV /applications folder arrives.
 *
 * These 8 people were hired into a mix of functions (only 2 of them into
 * "Product Manager" itself); the role assigned to each below is a stand-in
 * choice so we get demo coverage of both the PM and SPM rubric while
 * testing, not a claim about what role they actually applied for. This is
 * clearly a seed/demo affordance, not a claim about real applicants.
 *
 * Run with: npm run seed:demo
 */
import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { guessNameFromText } from "@/lib/parsing/guess-name";
import { getRepositories } from "@/lib/repositories";
import type { RoleKey } from "@/lib/rubric";

const HIRES_DIR = path.join(process.cwd(), "seed", "hires");

const SEED_ASSIGNMENTS: { file: string; roleKey: RoleKey; historicalNote: string }[] = [
  { file: "cv_01_rohan_desai.docx", roleKey: "pm", historicalNote: "Head of Engineering — Exceeds Expectations" },
  { file: "cv_02_sunita_krishnamurthy.docx", roleKey: "pm", historicalNote: "Operations Lead — Exceeds Expectations" },
  { file: "cv_03_vikram_nair.docx", roleKey: "pm", historicalNote: "Product Manager — Meets Expectations" },
  { file: "cv_04_aditya_shetty.docx", roleKey: "pm", historicalNote: "Sales Lead — Exceeds Expectations" },
  { file: "cv_05_preetham_rao.docx", roleKey: "spm", historicalNote: "Backend Engineer — Below Expectations" },
  { file: "cv_06_meghna_tiwari.docx", roleKey: "spm", historicalNote: "Customer Success Manager — Exceeds Expectations" },
  { file: "cv_07_lavanya_iyer.docx", roleKey: "spm", historicalNote: "Product Manager — Exceeds Expectations" },
  { file: "cv_08_rahul_bose.docx", roleKey: "spm", historicalNote: "Growth & Marketing Lead — Meets Expectations" },
];

async function main() {
  const repos = getRepositories();
  console.log(`Seeding demo data using repositories in "${repos.mode}" mode.\n`);

  const existingCandidates = await repos.candidates.list();

  for (const assignment of SEED_ASSIGNMENTS) {
    const resumeFilePath = `seed/hires/${assignment.file}`;
    if (existingCandidates.some((c) => c.resumeFilePath === resumeFilePath)) {
      console.log(`Skipping ${assignment.file} — already seeded.`);
      continue;
    }

    const filePath = path.join(HIRES_DIR, assignment.file);
    const buffer = await fs.readFile(filePath);
    const { value: rawText } = await mammoth.extractRawText({ buffer });
    const name = guessNameFromText(rawText);

    const candidate = await repos.candidates.create({
      name,
      email: null,
      phone: null,
      resumeFileName: assignment.file,
      resumeFilePath: `seed/hires/${assignment.file}`,
      resumeMimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      rawText,
    });

    const application = await repos.applications.create({
      candidateId: candidate.id,
      roleKey: assignment.roleKey,
      originalRoleKey: assignment.roleKey,
      roleOverridden: false,
    });

    console.log(
      `Seeded ${name} -> application ${application.id} (role: ${assignment.roleKey}, historical: ${assignment.historicalNote})`,
    );
  }

  console.log(
    "\nDone. Run `npm run dev` and open /dashboard, or run the AI pipeline against these applications once Milestone 3 is wired up.",
  );
}

main().catch((err) => {
  console.error("seed-demo failed:", err);
  process.exit(1);
});
