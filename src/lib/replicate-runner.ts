import Replicate from "replicate";
import { GenerationError, type GenerationStage } from "./generation-errors";

export const GENERATION_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;

export function getReplicateClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) {
    throw new GenerationError(
      "REPLICATE_API_TOKEN is not configured",
      "replicate_create",
    );
  }
  return new Replicate({ auth: token });
}

export function parseModelSpec(modelSpec: string):
  | { model: string; version?: never }
  | { version: string; model?: never } {
  if (modelSpec.includes(":")) {
    const [, version] = modelSpec.split(":");
    if (version) {
      return { version };
    }
  }
  return { model: modelSpec };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollPrediction(
  client: Replicate,
  predictionId: string,
  stage: GenerationStage,
  timeoutMs: number = GENERATION_TIMEOUT_MS,
): Promise<unknown> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const prediction = await client.predictions.get(predictionId);

    if (prediction.status === "succeeded") {
      return prediction.output;
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      const detail =
        typeof prediction.error === "string"
          ? prediction.error
          : "Replicate prediction failed";
      throw new GenerationError(detail, stage);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  const timeoutSeconds = Math.round(timeoutMs / 1000);
  throw new GenerationError(
    `Generation timed out after ${timeoutSeconds} seconds`,
    stage,
  );
}

export function extractOutputUrl(output: unknown): string | null {
  if (typeof output === "string" && output.startsWith("http")) {
    return output;
  }

  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string" && first.startsWith("http")) {
      return first;
    }
  }

  if (output && typeof output === "object" && "url" in output) {
    const url = (output as { url?: unknown }).url;
    if (typeof url === "function") {
      const resolved = url();
      return typeof resolved === "string" ? resolved : null;
    }
    if (typeof url === "string") {
      return url;
    }
  }

  return null;
}

export async function runReplicateWithTarget(
  target: { model?: string; version?: string },
  input: Record<string, unknown>,
  stage: GenerationStage,
  timeoutMs?: number,
): Promise<string> {
  const client = getReplicateClient();

  let prediction;
  try {
    prediction = await client.predictions.create({
      ...target,
      input,
    } as Parameters<Replicate["predictions"]["create"]>[0]);
  } catch (error) {
    throw new GenerationError(
      error instanceof Error
        ? error.message
        : "Failed to start Replicate prediction",
      "replicate_create",
      error,
    );
  }

  if (!prediction.id) {
    throw new GenerationError(
      "Replicate did not return a prediction id",
      "replicate_create",
    );
  }

  const output = await pollPrediction(
    client,
    prediction.id,
    stage,
    timeoutMs,
  );
  const outputUrl = extractOutputUrl(output);

  if (!outputUrl) {
    throw new GenerationError(
      "Replicate returned an unexpected response format",
      "replicate_output",
      output,
    );
  }

  return outputUrl;
}

export async function runReplicateModel(
  modelSpec: string,
  input: Record<string, unknown>,
  stage: GenerationStage = "replicate_poll",
): Promise<string> {
  return runReplicateWithTarget(parseModelSpec(modelSpec), input, stage);
}

export function isReplicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN?.trim());
}

export function isExtractModelConfigured(): boolean {
  return Boolean(process.env.REPLICATE_EXTRACT_MODEL?.trim());
}
