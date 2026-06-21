import type { StylePack } from "./types";

export interface StylePackOption {
  id: StylePack;
  label: string;
  description: string;
  prompt: string;
}

/** Single source of truth for all style packs. Add new styles here only. */
export const STYLE_PACKS: StylePackOption[] = [
  {
    id: "classic-comic",
    label: "Classic Comic",
    description: "Bold lines, halftone dots, vibrant pop-art colors",
    prompt:
      "bold black ink outlines, halftone Ben-Day dots, vibrant pop-art comic colors, dynamic comic panel",
  },
  {
    id: "manga",
    label: "Manga",
    description: "Japanese ink style with screentone shading",
    prompt:
      "black and white manga ink illustration, screentone shading, sharp clean linework, dramatic",
  },
  {
    id: "noir",
    label: "Noir",
    description: "High-contrast shadows, gritty crime-thriller mood",
    prompt:
      "high-contrast black and white noir, deep shadows, chiaroscuro lighting, gritty crime-thriller mood",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Film-grade lighting, dramatic depth, movie-poster mood",
    prompt:
      "cinematic film still, dramatic volumetric lighting, shallow depth of field, color graded, anamorphic, epic movie poster composition, highly detailed",
  },
  {
    id: "realism",
    label: "Realism",
    description: "Photorealistic detail and natural lighting",
    prompt:
      "photorealistic, ultra detailed skin and texture, natural soft lighting, sharp focus, lifelike, high dynamic range",
  },
  {
    id: "psychedelic-visionary",
    label: "Psychedelic Visionary",
    description: "Sacred-geometry, glowing fractal, visionary art",
    prompt:
      "visionary psychedelic art, intricate sacred geometry, glowing fractal patterns, luminous translucent layers, vibrant iridescent colors, mystical surreal detail",
  },
  {
    id: "horror",
    label: "Horror",
    description: "Dark, eerie, unsettling horror atmosphere",
    prompt:
      "dark horror art, eerie atmosphere, deep shadows, desaturated sickly palette, unsettling grim mood, gritty texture, cinematic dread",
  },
  {
    id: "steampunk",
    label: "Steampunk",
    description: "Brass gears, Victorian industrial fantasy",
    prompt:
      "steampunk art, brass gears and cogs, Victorian industrial machinery, copper and bronze tones, intricate mechanical detail, warm gaslight glow",
  },
  {
    id: "japanese-traditional",
    label: "Japanese Traditional",
    description: "Ukiyo-e woodblock, irezumi linework",
    prompt:
      "traditional Japanese ukiyo-e woodblock art, irezumi tattoo linework, bold waves and clouds, flat color planes, fine ink outlines",
  },
  {
    id: "anime",
    label: "Anime",
    description: "Clean cel-shaded anime illustration",
    prompt:
      "clean cel-shaded anime illustration, vibrant saturated colors, expressive detailed eyes, crisp line art, soft anime shading",
  },
  {
    id: "cartoon",
    label: "Cartoon",
    description: "Playful bold cartoon with clean outlines",
    prompt:
      "playful cartoon illustration, bold clean outlines, bright flat colors, exaggerated shapes, fun lighthearted style",
  },
];

/** Style-pack id → SDXL img2img prompt (derived from STYLE_PACKS). */
export const STYLE_PACK_PROMPTS: Record<string, string> = Object.fromEntries(
  STYLE_PACKS.map((pack) => [pack.id, pack.prompt]),
);

export function getStylePack(id: string): StylePackOption | undefined {
  return STYLE_PACKS.find((pack) => pack.id === id);
}

export function getStylePrompt(stylePack: string): string {
  return STYLE_PACK_PROMPTS[stylePack] ?? "";
}

export function isStylePack(value: string): value is StylePack {
  return Object.prototype.hasOwnProperty.call(STYLE_PACK_PROMPTS, value);
}
