import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/generation-guard";
import { getSiteUrl } from "@/lib/site-url";
import {
  StripePriceNotFoundError,
  getStripeClient,
  isStripeCheckoutConfigured,
  resolvePriceIdForProduct,
} from "@/lib/stripe-client";
import { getTokenPackConfig, isTokenPackKey } from "@/lib/token-packs";

export const runtime = "nodejs";

interface CheckoutRequestBody {
  pack?: string;
}

export async function POST(request: Request) {
  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const auth = await requireAuthenticatedUser();
  if (auth instanceof NextResponse) {
    return auth;
  }
  const { userId } = auth;

  let body: CheckoutRequestBody;
  try {
    body = (await request.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const packKey = body.pack?.trim();
  if (!packKey || !isTokenPackKey(packKey)) {
    return NextResponse.json(
      { error: 'pack must be one of: "TRY_IT", "CREATOR", "ELITE".' },
      { status: 400 },
    );
  }

  const pack = getTokenPackConfig(packKey);
  if (!pack) {
    return NextResponse.json({ error: "Unknown token pack." }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const priceId = await resolvePriceIdForProduct(pack.productId);
    const siteUrl = getSiteUrl(request);

    const metadata = {
      supabase_user_id: userId,
      pack: packKey,
      tokens: String(pack.tokens),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/?purchase=success`,
      cancel_url: `${siteUrl}/pricing?purchase=cancelled`,
      client_reference_id: userId,
      metadata,
      payment_intent_data: {
        metadata,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof StripePriceNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 },
    );
  }
}
