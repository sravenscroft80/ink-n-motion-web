import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripeClient,
  getStripeWebhookSecret,
} from "@/lib/stripe-client";
import {
  isCheckoutSessionProcessed,
  isStripeEventProcessed,
  recordStripeEventOnce,
} from "@/lib/stripe-processed";
import {
  getTokenPackConfig,
  isTokenPackKey,
  type TokenPackKey,
} from "@/lib/token-packs";
import { grantTokens } from "@/lib/tokens";

export const runtime = "nodejs";

async function creditTokensForCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<void> {
  if (session.payment_status !== "paid") {
    return;
  }

  const sessionId = session.id;
  if (!sessionId) {
    console.error("Stripe webhook: checkout session missing id", eventId);
    return;
  }

  if (await isCheckoutSessionProcessed(sessionId)) {
    return;
  }

  if (await isStripeEventProcessed(eventId)) {
    return;
  }

  const userId =
    session.metadata?.supabase_user_id?.trim() ||
    session.client_reference_id?.trim() ||
    null;

  const packRaw = session.metadata?.pack?.trim() ?? "";
  if (!userId || !isTokenPackKey(packRaw)) {
    console.error("Stripe webhook: missing user or pack metadata", {
      eventId,
      sessionId,
      userId,
      packRaw,
    });
    return;
  }

  const packKey = packRaw as TokenPackKey;
  const pack = getTokenPackConfig(packKey);
  if (!pack) {
    console.error("Stripe webhook: unknown pack in metadata", packKey);
    return;
  }

  const tokens = pack.tokens;

  await grantTokens(userId, tokens, "purchase", {
    stripeCheckoutSessionId: sessionId,
    packId: packKey,
    action: "purchase",
  });

  await recordStripeEventOnce({
    eventId,
    eventType: "checkout.session.completed",
    checkoutSessionId: sessionId,
    userId,
    pack: packKey,
    tokensGranted: tokens,
  });
}

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await creditTokensForCheckoutSession(session, event.id);
    }
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
