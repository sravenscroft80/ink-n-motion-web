import { GenerationError } from "./generation-errors";
import {
  parseModelSpec,
  runReplicateWithTarget,
} from "./replicate-runner";

const DEFAULT_VIDEO_MODEL = "bytedance/seedance-1-lite";
const VIDEO_POLL_TIMEOUT_MS = 270_000;

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

export async function generateVideo(
  imageUrl: string,
  durationSeconds: 5 | 10,
  prompt?: string,
): Promise<string> {
  if (!isValidImageUrl(imageUrl)) {
    throw new GenerationError("A valid imageUrl is required.", "replicate_create");
  }

  const trimmedPrompt = prompt?.trim();
  const input: Record<string, unknown> = {
    image: imageUrl,
    duration: durationSeconds,
    resolution: "720p",
    ...(trimmedPrompt ? { prompt: trimmedPrompt } : {}),
  };

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
