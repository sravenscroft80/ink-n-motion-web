import { NextResponse } from "next/server";
import { addCredits, CHECKOUT_CREDIT_PACK } from "@/lib/credits";
import { verifyCheckoutSession } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mock = searchParams.get("mock") === "true";
  const sessionId = searchParams.get("session_id");

  let creditsToAdd = 0;

  if (mock) {
    creditsToAdd = CHECKOUT_CREDIT_PACK;
  } else if (sessionId) {
    const verification = await verifyCheckoutSession(sessionId);
    if (!verification.paid) {
      return NextResponse.redirect(new URL("/?checkout=failed", request.url));
    }
    creditsToAdd = verification.credits;
  } else {
    return NextResponse.redirect(new URL("/?checkout=failed", request.url));
  }

  await addCredits(creditsToAdd);

  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("checkout", "success");
  redirectUrl.searchParams.set("credits", String(creditsToAdd));

  return NextResponse.redirect(redirectUrl);
}
