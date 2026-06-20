import Replicate from "replicate";
import { getStylePrompt, isStylePack } from "./style-packs";
import type { StylePack } from "./types";

const DEFAULT_VERSION =
  "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

export const GENERATION_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;

const NEGATIVE_PROMPT =
  "blurry, low quality, watermark, text, ugly, deformed, distorted, amateur";

function getReplicateClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }
  return new Replicate({ auth: token });
}

function resolveModelTarget():
  | { model: string; version?: never }
  | { version: string; model?: never } {
  const configured = process.env.REPLICATE_MODEL?.trim();

  if (!configured) {
    return { version: DEFAULT_VERSION };
  }

  if (configured.includes(":")) {
    const [, version] = configured.split(":");
    if (version) {
      return { version };
    }
  }

  return { model: configured };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollPrediction(
  client: Replicate,
  predictionId: string,
): Promise<unknown> {
  const deadline = Date.now() + GENERATION_TIMEOUT_MS;

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
      throw new Error(detail);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Generation timed out after 60 seconds");
}

function extractOutputUrl(output: unknown): string | null {
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

export async function generateComicRender(
  imageUrl: string,
  stylePack: StylePack,
  scenePrompt?: string,
): Promise<string> {
  if (!isStylePack(stylePack)) {
    throw new Error("Invalid style pack");
  }

  const client = getReplicateClient();
  const stylePrompt = getStylePrompt(stylePack);
  const scene = scenePrompt?.trim();
  const prompt = scene
    ? `comic book panel illustration, ${scene}, tattoo art, ${stylePrompt}`
    : `tattoo art, comic book illustration, ${stylePrompt}`;
  const target = resolveModelTarget();

  const input = {
    image: imageUrl,
    prompt,
    negative_prompt: NEGATIVE_PROMPT,
    prompt_strength: 0.75,
    num_inference_steps: 30,
    guidance_scale: 7.5,
    num_outputs: 1,
    disable_safety_checker: false,
  };

  const prediction = await client.predictions.create({
    ...target,
    input,
  });

  if (!prediction.id) {
    throw new Error("Replicate did not return a prediction id");
  }

  const output = await pollPrediction(client, prediction.id);
  const outputUrl = extractOutputUrl(output);

  if (!outputUrl) {
    throw new Error("Replicate returned an unexpected response format");
  }

  return outputUrl;
}

export function isReplicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN?.trim());
}
