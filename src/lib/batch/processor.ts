import { getRepositories, type Application } from "@/lib/repositories";
import { processApplication } from "@/lib/pipeline/process-application";

/**
 * Starts a batch run over every NEW / PROCESSING_FAILED application and
 * returns immediately with the created BatchRun so the caller (an API
 * route) can respond right away with a pollable id — the sequential loop
 * itself continues afterward without being awaited. Only correct on a
 * long-lived Node process (`next dev` / `next start`), not on a
 * response-lifetime-limited serverless deployment — see the build plan's
 * "known risks" section.
 *
 * Each application is processed one at a time through the exact same
 * lib/pipeline/process-application.ts used by the single-upload path, so
 * batch and single-upload behavior never diverge. A failure on one
 * application is caught and logged; the loop always continues to the next.
 */
export async function startBatch(): Promise<{ batchRunId: string; totalCount: number }> {
  const repos = getRepositories();
  const pending = await repos.applications.listByStatuses(["NEW", "PROCESSING_FAILED"]);

  const run = await repos.batchRuns.start(pending.length);

  // Deliberately not awaited — see function doc comment.
  void runLoop(run.id, pending);

  return { batchRunId: run.id, totalCount: pending.length };
}

async function runLoop(batchRunId: string, applications: Application[]): Promise<void> {
  const repos = getRepositories();
  let processedCount = 0;
  let succeededCount = 0;
  const failures: { applicationId: string; fileName: string; error: string }[] = [];

  for (const application of applications) {
    await repos.batchRuns.update(batchRunId, { currentApplicationId: application.id });

    try {
      const result = await processApplication(application.id);
      if (result.ok) {
        succeededCount++;
      } else {
        const candidate = await repos.candidates.getById(application.candidateId);
        failures.push({
          applicationId: application.id,
          fileName: candidate?.resumeFileName ?? "unknown file",
          error: result.error,
        });
      }
    } catch (err) {
      // processApplication already routes expected failures to a discriminated
      // result — this only catches a truly unexpected throw, so one bad
      // candidate can never abort the rest of the batch.
      const message = err instanceof Error ? err.message : String(err);
      const candidate = await repos.candidates.getById(application.candidateId);
      failures.push({
        applicationId: application.id,
        fileName: candidate?.resumeFileName ?? "unknown file",
        error: message,
      });
    }

    processedCount++;
    await repos.batchRuns.update(batchRunId, {
      processedCount,
      succeededCount,
      failedCount: failures.length,
      failures,
    });
  }

  await repos.batchRuns.update(batchRunId, {
    status: "completed",
    currentApplicationId: null,
    finishedAt: new Date().toISOString(),
  });
}
