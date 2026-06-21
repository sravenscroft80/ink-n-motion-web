export const TOKEN_PACK_KEYS = {
  TRY_IT: "TRY_IT",
  CREATOR: "CREATOR",
  ELITE: "ELITE",
} as const;

export type TokenPackKey =
  (typeof TOKEN_PACK_KEYS)[keyof typeof TOKEN_PACK_KEYS];

export interface TokenPackConfig {
  key: TokenPackKey;
  name: string;
  priceUsd: number;
  tokens: number;
  productId: string;
  badge?: string;
}

/** Server-side source of truth for pack sizes and Stripe product IDs. */
export const TOKEN_PACKS: Record<TokenPackKey, TokenPackConfig> = {
  TRY_IT: {
    key: TOKEN_PACK_KEYS.TRY_IT,
    name: "Try It",
    priceUsd: 4.99,
    tokens: 25,
    productId: "prod_UkJQXZKRA8YBXx",
  },
  CREATOR: {
    key: TOKEN_PACK_KEYS.CREATOR,
    name: "Creator",
    priceUsd: 12.99,
    tokens: 80,
    productId: "prod_UkJRUNw0hOE15R",
    badge: "Most Popular",
  },
  ELITE: {
    key: TOKEN_PACK_KEYS.ELITE,
    name: "Elite",
    priceUsd: 24.99,
    tokens: 200,
    productId: "prod_UkJR0jzWQE1w7y",
  },
};

export const TOKEN_PACK_LIST: TokenPackConfig[] = [
  TOKEN_PACKS.TRY_IT,
  TOKEN_PACKS.CREATOR,
  TOKEN_PACKS.ELITE,
];

export function isTokenPackKey(value: string): value is TokenPackKey {
  return value in TOKEN_PACKS;
}

export function getTokenPackConfig(pack: string): TokenPackConfig | undefined {
  if (!isTokenPackKey(pack)) {
    return undefined;
  }
  return TOKEN_PACKS[pack];
}

export function getTokenPackTokens(pack: TokenPackKey): number {
  return TOKEN_PACKS[pack].tokens;
}
