import { GenerationError } from "./generation-errors";
import {
  isExtractModelConfigured,
  runReplicateModel,
} from "./replicate-runner";

export interface PreparedTattooImage {
  url: string;
  extracted: boolean;
}

/**
 * When isolate is false, returns the original URL unchanged.
 * When isolate is true, runs REPLICATE_EXTRACT_MODEL (required).
 */
export async function prepareTattooImage(
  imageUrl: string,
  isolate: boolean,
): Promise<PreparedTattooImage> {
  if (!isolate) {
    return { url: imageUrl, extracted: false };
  }

  if (!isExtractModelConfigured()) {
    throw new GenerationError(
      "Isolate tattoo is not available — REPLICATE_EXTRACT_MODEL must be configured on the server.",
      "extract",
    );
  }

  const extractModel = process.env.REPLICATE_EXTRACT_MODEL!.trim();

  try {
    const outputUrl = await runReplicateModel(
      extractModel,
      { image: imageUrl },
      "extract",
    );
    return { url: outputUrl, extracted: true };
  } catch (error) {
    if (error instanceof GenerationError) {
      throw error;
    }
    throw new GenerationError(
      error instanceof Error
        ? error.message
        : "Tattoo extraction failed before stylization.",
      "extract",
      error,
    );
  }
}
