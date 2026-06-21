export const TOKEN_EXPIRY_DAYS = 60;
export const SIGNUP_BONUS_TOKENS = 3;

export const TOKEN_ACTIONS = {
  comic_page_on_skin: "comic_page_on_skin",
  comic_page_isolate: "comic_page_isolate",
  style_still: "style_still",
  design_pack: "design_pack",
  video_5s: "video_5s",
  video_10s: "video_10s",
  image_rerender: "image_rerender",
  video_rerender: "video_rerender",
} as const;

export type TokenAction =
  (typeof TOKEN_ACTIONS)[keyof typeof TOKEN_ACTIONS];

export const TOKEN_COSTS: Record<TokenAction, number> = {
  comic_page_on_skin: 1,
  comic_page_isolate: 2,
  style_still: 1,
  design_pack: 2,
  video_5s: 8,
  video_10s: 15,
  image_rerender: 1,
  video_rerender: 8,
};

export function getTokenCost(action: TokenAction): number {
  return TOKEN_COSTS[action];
}

export function getComicPageCost(isolate: boolean): number {
  return isolate
    ? TOKEN_COSTS.comic_page_isolate
    : TOKEN_COSTS.comic_page_on_skin;
}

export function getComicPageAction(isolate: boolean): TokenAction {
  return isolate
    ? TOKEN_ACTIONS.comic_page_isolate
    : TOKEN_ACTIONS.comic_page_on_skin;
}

/** Single style still via /api/generate */
export function getStyleStillCost(): number {
  return TOKEN_COSTS.style_still;
}

export function getStyleStillAction(): TokenAction {
  return TOKEN_ACTIONS.style_still;
}

export function isTokenAction(value: string): value is TokenAction {
  return value in TOKEN_COSTS;
}
