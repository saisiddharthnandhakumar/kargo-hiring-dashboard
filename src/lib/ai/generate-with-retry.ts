import { generateObject } from "ai";
import type { z } from "zod";
import { getLanguageModel, getModelId } from "./provider";

export type StructuredGenerationResult<T> =
  | { ok: true; data: T; modelId: string }
  | { ok: false; error: string };

/**
 * Calls generateObject once; on a schema-validation failure or transient
 * error, retries exactly once with the same input. If that also fails,
 * returns a discriminated failure result instead of throwing — callers
 * (the pipeline) route this to PROCESSING_FAILED rather than crashing or
 * persisting a partial/invalid record.
 */
export async function generateStructured<T>(params: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
}): Promise<StructuredGenerationResult<T>> {
  const model = getLanguageModel();
  const modelId = getModelId();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await generateObject({
        model,
        schema: params.schema,
        system: params.system,
        prompt: params.prompt,
      });
      return { ok: true, data: result.object, modelId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[ai] generateObject failed (attempt ${attempt}/2): ${message}`,
        err instanceof Error && "cause" in err ? { cause: (err as { cause?: unknown }).cause } : "",
      );
      if (attempt === 2) {
        return { ok: false, error: `AI generation failed after retry: ${message}` };
      }
    }
  }

  // Unreachable, but keeps TypeScript satisfied.
  return { ok: false, error: "AI generation failed for an unknown reason." };
}
