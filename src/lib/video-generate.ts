import { GenerationError } from "./generation-errors";
import {
  createPrediction,
  parseModelSpec,
  runReplicateWithTarget,
} from "./replicate-runner";

const DEFAULT_VIDEO_MODEL = "bytedance/seedance-1-lite";
const VIDEO_POLL_TIMEOUT_MS = 270_000;
export const DEFAULT_VIDEO_PROMPT =
  "Bring this image to life with subtle natural motion, cinematic gentle movement, smooth animation";

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveVideoModelTarget() {
  const configured = process.env.REPLICATE_VIDEO_MODEL?.trim();
  const modelSpec = configured || DEFAULT_VIDEO_MODEL;
  return parseModelSpec(modelSpec);
}

function buildVideoInput(
  imageUrl: string,
  durationSeconds: 5 | 10,
  prompt?: string,
): Record<string, unknown> {
  const trimmedPrompt = prompt?.trim();

  return {
    image: imageUrl,
    duration: durationSeconds,
    resolution: "720p",
    prompt:
      trimmedPrompt && trimmedPrompt.length > 0
        ? trimmedPrompt
        : DEFAULT_VIDEO_PROMPT,
  };
}

export async function startVideoGeneration(
  imageUrl: string,
  durationSeconds: 5 | 10,
  prompt?: string,
): Promise<string> {
  if (!isValidImageUrl(imageUrl)) {
    throw new GenerationError("A valid imageUrl is required.", "replicate_create");
  }

  const input = buildVideoInput(imageUrl, durationSeconds, prompt);

  try {
    const prediction = await createPrediction(resolveVideoModelTarget(), input);
    return prediction.id!;
  } catch (error) {
    if (error instanceof GenerationError) {
      throw error;
    }
    throw new GenerationError(
      error instanceof Error ? error.message : "Video generation failed",
      "replicate_create",
      error,
    );
  }
}

export async function generateVideo(
  imageUrl: string,
  durationSeconds: 5 | 10,
  prompt?: string,
): Promise<string> {
  if (!isValidImageUrl(imageUrl)) {
    throw new GenerationError("A valid imageUrl is required.", "replicate_create");
  }

  const input = buildVideoInput(imageUrl, durationSeconds, prompt);

  try {
    return await runReplicateWithTarget(
      resolveVideoModelTarget(),
      input,
      "replicate_poll",
      VIDEO_POLL_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof GenerationError) {
      throw error;
    }
    throw new GenerationError(
      error instanceof Error ? error.message : "Video generation failed",
      "replicate_poll",
      error,
    );
  }
}
