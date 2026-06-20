import { GenerationError } from "./generation-errors";
import {
  isExtractModelConfigured,
  isReplicateConfigured,
  parseModelSpec,
  runReplicateModel,
  runReplicateWithTarget,
} from "./replicate-runner";
import { getStylePrompt, isStylePack } from "./style-packs";
import { prepareTattooImage } from "./tattoo-extract";
import type { StylePack } from "./types";

const DEFAULT_VERSION =
  "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

const TATTOO_ISOLATION_PREFIX =
  "isolated tattoo design flash sheet on plain white background, extract and render ONLY the tattoo artwork, clean graphic linework, no skin, no limbs, no body, no photograph";

const NEGATIVE_PROMPT =
  "skin, flesh, arm, hand, wrist, finger, limb, body, torso, leg, face, neck, " +
  "realistic photograph, photo background, camera, room, clutter, " +
  "blurry, low quality, watermark, text, ugly, deformed, distorted, amateur";

function resolveStylizeModelTarget():
  | { model: string; version?: never }
  | { version: string; model?: never } {
  const configured = process.env.REPLICATE_MODEL?.trim();
  if (!configured) {
    return { version: DEFAULT_VERSION };
  }
  return parseModelSpec(configured);
}

function buildStylizePrompt(stylePrompt: string, scene?: string): string {
  if (scene) {
    return `${TATTOO_ISOLATION_PREFIX}, comic book panel, ${scene}, ${stylePrompt}`;
  }
  return `${TATTOO_ISOLATION_PREFIX}, ${stylePrompt}`;
}

export async function generateComicRender(
  imageUrl: string,
  stylePack: StylePack,
  scenePrompt?: string,
): Promise<string> {
  if (!isStylePack(stylePack)) {
    throw new GenerationError("Invalid style pack", "stylize");
  }

  const prepared = await prepareTattooImage(imageUrl);
  const stylePrompt = getStylePrompt(stylePack);
  const scene = scenePrompt?.trim();
  const prompt = buildStylizePrompt(stylePrompt, scene);

  try {
    return await runReplicateWithTarget(
      resolveStylizeModelTarget(),
      {
        image: prepared.url,
        prompt,
        negative_prompt: NEGATIVE_PROMPT,
        prompt_strength: 0.82,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        num_outputs: 1,
        disable_safety_checker: false,
      },
      "stylize",
    );
  } catch (error) {
    if (error instanceof GenerationError) {
      throw error;
    }
    throw new GenerationError(
      error instanceof Error ? error.message : "Stylization failed",
      "stylize",
      error,
    );
  }
}

export {
  isExtractModelConfigured,
  isReplicateConfigured,
  runReplicateModel,
};
