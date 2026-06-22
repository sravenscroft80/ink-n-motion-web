import { STYLE_PACKS } from "./style-packs";
import type { StylePack } from "./types";

export type ComicStyle = StylePack;

export const MIN_PAGES = 5;
export const MAX_PAGES = 7;
export const DEFAULT_PAGES = 5;
export const ALLOWED_PAGE_COUNTS = [5, 7] as const;

export function isAllowedPageCount(n: number): boolean {
  return (ALLOWED_PAGE_COUNTS as readonly number[]).includes(n);
}

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
