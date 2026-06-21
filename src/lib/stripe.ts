import Stripe from "stripe";

const LEGACY_CHECKOUT_TOKENS = 10;

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PRICE_ID?.trim(),
  );
}

function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey);
}

function getBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function createCheckoutSession(
  request: Request,
): Promise<{ url: string; mock: boolean }> {
  const stripe = getStripeClient();
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  const baseUrl = getBaseUrl(request);

  if (!stripe || !priceId) {
    return {
      url: `${baseUrl}/api/checkout/complete?mock=true`,
      mock: true,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/api/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?checkout=cancelled`,
    metadata: {
      tokens: String(LEGACY_CHECKOUT_TOKENS),
      product: "ink-n-motion-tokens",
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return { url: session.url, mock: false };
}

export async function verifyCheckoutSession(
  sessionId: string,
): Promise<{ paid: boolean; credits: number }> {
  const stripe = getStripeClient();
  if (!stripe) {
    return { paid: false, credits: 0 };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const tokens = Number.parseInt(
    session.metadata?.tokens ?? session.metadata?.credits ?? "0",
    10,
  );

  return {
    paid: session.payment_status === "paid",
    credits: Number.isFinite(tokens) ? tokens : LEGACY_CHECKOUT_TOKENS,
  };
}
