import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

const DEFAULT_MODEL_ID = "gemini-flash-latest";

export function isAiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export function getModelId(): string {
  return process.env.AI_MODEL_ID?.trim() || DEFAULT_MODEL_ID;
}

/**
 * Returns the configured language model, or throws a clear error if no API
 * key is present. Callers (the pipeline) must catch this and route to
 * PROCESSING_FAILED rather than letting it bubble up as an unhandled 500.
 */
export function getLanguageModel(): LanguageModel {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is not set. Add it to .env.local to enable AI processing.",
    );
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google(getModelId());
}
