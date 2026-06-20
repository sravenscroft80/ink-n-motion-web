import type { StylePack } from "./types";

export interface StylePackOption {
  id: StylePack;
  label: string;
  description: string;
  prompt: string;
}

/** Style-pack → SDXL img2img prompt mapping */
export const STYLE_PACK_PROMPTS: Record<StylePack, string> = {
  "classic-comic":
    "bold black ink outlines, halftone Ben-Day dots, vibrant pop-art comic colors, dynamic comic panel",
  manga:
    "black and white manga ink illustration, screentone shading, sharp clean linework, dramatic",
  noir: "high-contrast black and white noir, deep shadows, chiaroscuro lighting, gritty crime-thriller mood",
};

export const STYLE_PACKS: StylePackOption[] = [
  {
    id: "classic-comic",
    label: "Classic Comic",
    description: "Bold lines, halftone dots, vibrant pop-art colors",
    prompt: STYLE_PACK_PROMPTS["classic-comic"],
  },
  {
    id: "manga",
    label: "Manga",
    description: "Japanese ink style with screentone shading",
    prompt: STYLE_PACK_PROMPTS.manga,
  },
  {
    id: "noir",
    label: "Noir",
    description: "High-contrast shadows and gritty crime-thriller mood",
    prompt: STYLE_PACK_PROMPTS.noir,
  },
];

export function getStylePack(id: string): StylePackOption | undefined {
  return STYLE_PACKS.find((pack) => pack.id === id);
}

export function getStylePrompt(stylePack: StylePack): string {
  return STYLE_PACK_PROMPTS[stylePack];
}

export function isStylePack(value: string): value is StylePack {
  return value in STYLE_PACK_PROMPTS;
}
