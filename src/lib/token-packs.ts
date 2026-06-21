export const TOKEN_PACK_IDS = {
  try_it: "try_it",
  creator: "creator",
  elite: "elite",
} as const;

export type TokenPackId = (typeof TOKEN_PACK_IDS)[keyof typeof TOKEN_PACK_IDS];

export interface TokenPack {
  id: TokenPackId;
  name: string;
  priceUsd: number;
  tokens: number;
  badge?: string;
  stripePriceEnvKey: string;
}

export const TOKEN_PACKS: TokenPack[] = [
  {
    id: TOKEN_PACK_IDS.try_it,
    name: "Try It",
    priceUsd: 4.99,
    tokens: 25,
    stripePriceEnvKey: "STRIPE_PRICE_ID_TRY_IT",
  },
  {
    id: TOKEN_PACK_IDS.creator,
    name: "Creator",
    priceUsd: 12.99,
    tokens: 80,
    badge: "Most Popular",
    stripePriceEnvKey: "STRIPE_PRICE_ID_CREATOR",
  },
  {
    id: TOKEN_PACK_IDS.elite,
    name: "Elite",
    priceUsd: 24.99,
    tokens: 200,
    stripePriceEnvKey: "STRIPE_PRICE_ID_ELITE",
  },
];

export function getTokenPack(packId: string): TokenPack | undefined {
  return TOKEN_PACKS.find((pack) => pack.id === packId);
}

export function getStripePriceIdForPack(packId: TokenPackId): string | null {
  const pack = getTokenPack(packId);
  if (!pack) {
    return null;
  }

  const priceId = process.env[pack.stripePriceEnvKey]?.trim();
  return priceId || null;
}

export function isTokenPackId(value: string): value is TokenPackId {
  return TOKEN_PACKS.some((pack) => pack.id === value);
}
