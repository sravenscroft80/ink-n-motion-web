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

const ISOLATED_NEGATIVE_PROMPT =
  "skin, flesh, arm, hand, wrist, finger, limb, body, torso, leg, face, neck, " +
  "realistic photograph, photo background, camera, room, clutter, " +
  "blurry, low quality, watermark, text, ugly, deformed, distorted, amateur";

const ON_SKIN_NEGATIVE_PROMPT =
  "blurry, low quality, watermark, text, ugly, deformed, distorted, amateur";

export interface GenerateRenderOptions {
  scenePrompt?: string;
  /** When true, run background removal before stylization. Default false. */
  isolate?: boolean;
  /**
   * 0–1: higher values preserve more of the source image (maps to lower SDXL prompt_strength).
   * When omitted, uses the default strength for the render mode.
   */
  imageInfluence?: number;
}

function resolveStylizeModelTarget():
  | { model: string; version?: never }
  | { version: string; model?: never } {
  const configured = process.env.REPLICATE_MODEL?.trim();
  if (!configured) {
    return { version: DEFAULT_VERSION };
  }
  return parseModelSpec(configured);
}

function buildStylizePrompt(
  stylePrompt: string,
  isolate: boolean,
  scene?: string,
): string {
  if (isolate) {
    if (scene) {
      return `${TATTOO_ISOLATION_PREFIX}, comic book panel, ${scene}, ${stylePrompt}`;
    }
    return `${TATTOO_ISOLATION_PREFIX}, ${stylePrompt}`;
  }

  if (scene) {
    return `comic book panel illustration, ${scene}, tattoo art on skin, ${stylePrompt}`;
  }
  return `tattoo art, comic book illustration on skin, ${stylePrompt}`;
}

function resolvePromptStrength(
  options: GenerateRenderOptions,
  isolate: boolean,
): number {
  if (options.imageInfluence !== undefined) {
    const maxStrength = isolate ? 0.92 : 0.9;
    const minStrength = isolate ? 0.48 : 0.45;
    return maxStrength - options.imageInfluence * (maxStrength - minStrength);
  }

  return isolate ? 0.82 : 0.75;
}

function wrapTimeoutError(error: GenerationError, isolate: boolean): GenerationError {
  if (!isolate || !error.message.includes("timed out")) {
    return error;
  }
  return new GenerationError(
    "Generation timed out after 60 seconds. Isolate tattoo runs two AI steps and can exceed the Hobby limit — try Keep on skin, or try again.",
    error.stage,
    error,
  );
}

export async function generateComicRender(
  imageUrl: string,
  stylePack: StylePack,
  options: GenerateRenderOptions = {},
): Promise<string> {
  if (!isStylePack(stylePack)) {
    throw new GenerationError("Invalid style pack", "stylize");
  }

  const isolate = options.isolate ?? false;
  const stylePrompt = getStylePrompt(stylePack);
  const scene = options.scenePrompt?.trim();
  const prompt = buildStylizePrompt(stylePrompt, isolate, scene);

  try {
    const prepared = await prepareTattooImage(imageUrl, isolate);

    return await runReplicateWithTarget(
      resolveStylizeModelTarget(),
      {
        image: prepared.url,
        prompt,
        negative_prompt: isolate ? ISOLATED_NEGATIVE_PROMPT : ON_SKIN_NEGATIVE_PROMPT,
        prompt_strength: resolvePromptStrength(options, isolate),
        num_inference_steps: 30,
        guidance_scale: 7.5,
        num_outputs: 1,
        disable_safety_checker: false,
      },
      "stylize",
    );
  } catch (error) {
    if (error instanceof GenerationError) {
      throw wrapTimeoutError(error, isolate);
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
