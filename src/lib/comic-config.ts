import { STYLE_PACKS } from "./style-packs";
import type { StylePack } from "./types";

export type ComicStyle = StylePack;

export const MIN_PAGES = 1;
export const MAX_PAGES = 1;

export const COMIC_STYLES: Record<
  string,
  { label: string; description: string }
> = Object.fromEntries(
  STYLE_PACKS.map((pack) => [
    pack.id,
    { label: pack.label, description: pack.description },
  ]),
);

export function isComicStyle(value: string): value is ComicStyle {
  return Object.prototype.hasOwnProperty.call(COMIC_STYLES, value);
}

export interface ComicPage {
  caption: string;
  image: string;
}

export interface Comic {
  title: string;
  pages: ComicPage[];
}
