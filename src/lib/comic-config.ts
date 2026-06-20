import type { StylePack } from "./types";

export type ComicStyle = StylePack;

export const MIN_PAGES = 1;
export const MAX_PAGES = 4;

export const COMIC_STYLES: Record<
  ComicStyle,
  { label: string; description: string }
> = {
  "classic-comic": {
    label: "Classic Comic",
    description: "Bold ink, halftone dots, pop-art colors",
  },
  manga: {
    label: "Manga",
    description: "Black & white ink with screentone shading",
  },
  noir: {
    label: "Noir",
    description: "High-contrast shadows, gritty thriller mood",
  },
};

export function isComicStyle(value: string): value is ComicStyle {
  return value in COMIC_STYLES;
}

export interface ComicPage {
  caption: string;
  image: string;
}

export interface Comic {
  title: string;
  pages: ComicPage[];
}
