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
 * Optional preprocessing: when REPLICATE_EXTRACT_MODEL is set, run background
 * removal before img2img so skin/limbs are less likely to reach the stylizer.
 * When unset, returns the original URL unchanged.
 */
export async function prepareTattooImage(
  imageUrl: string,
): Promise<PreparedTattooImage> {
  const extractModel = process.env.REPLICATE_EXTRACT_MODEL?.trim();
  if (!extractModel || !isExtractModelConfigured()) {
    return { url: imageUrl, extracted: false };
  }

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
