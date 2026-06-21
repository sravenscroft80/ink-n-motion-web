import { NextResponse } from "next/server";
import { verifyCheckoutSession } from "@/lib/stripe";

export const runtime = "nodejs";

/** Legacy checkout redirect — token crediting moves to Stripe webhook in Stage 5. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mock = searchParams.get("mock") === "true";
  const sessionId = searchParams.get("session_id");

  if (mock) {
    return NextResponse.redirect(new URL("/pricing?checkout=mock", request.url));
  }

  if (sessionId) {
    const verification = await verifyCheckoutSession(sessionId);
    if (!verification.paid) {
      return NextResponse.redirect(new URL("/pricing?checkout=failed", request.url));
    }
    return NextResponse.redirect(new URL("/pricing?checkout=success", request.url));
  }

  return NextResponse.redirect(new URL("/pricing?checkout=failed", request.url));
}
