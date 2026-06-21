import Stripe from "stripe";

let stripeClient: Stripe | null = null;

const priceIdCache = new Map<string, string>();

export function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function isStripeCheckoutConfigured(): boolean {
  return Boolean(getStripeSecretKey());
}

export function getStripeClient(): Stripe {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export class StripePriceNotFoundError extends Error {
  constructor(productId: string) {
    super(`No active Stripe price found for product ${productId}.`);
    this.name = "StripePriceNotFoundError";
  }
}

export async function resolvePriceIdForProduct(
  productId: string,
): Promise<string> {
  const cached = priceIdCache.get(productId);
  if (cached) {
    return cached;
  }

  const stripe = getStripeClient();
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 1,
  });

  const priceId = prices.data[0]?.id;
  if (!priceId) {
    throw new StripePriceNotFoundError(productId);
  }

  priceIdCache.set(productId, priceId);
  return priceId;
}

/** Test-only helper to reset module state between runs. */
export function clearStripePriceCacheForTests(): void {
  priceIdCache.clear();
}
