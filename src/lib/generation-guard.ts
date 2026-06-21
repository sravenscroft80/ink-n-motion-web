import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import {
  InsufficientTokensError,
  getSpendableBalance,
} from "@/lib/tokens";

export async function requireAuthenticatedUser(): Promise<
  { userId: string } | NextResponse
> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      {
        error: "Log in to create.",
        code: "unauthorized",
      },
      { status: 401 },
    );
  }
  return { userId };
}

export function insufficientTokensResponse(
  cost: number,
  balance: number,
): NextResponse {
  return NextResponse.json(
    {
      error: `Not enough tokens. This action requires ${cost} token${cost === 1 ? "" : "s"}.`,
      code: "insufficient_tokens",
      cost,
      balance,
    },
    { status: 402 },
  );
}

export async function handleInsufficientTokens(
  error: unknown,
  cost: number,
): Promise<NextResponse | null> {
  if (error instanceof InsufficientTokensError) {
    return insufficientTokensResponse(error.required, error.available);
  }

  if (
    error instanceof Error &&
    error.message.includes("insufficient_tokens")
  ) {
    return insufficientTokensResponse(cost, 0);
  }

  return null;
}

export async function tokensRemainingPayload(userId: string) {
  const balance = await getSpendableBalance(userId);
  return { tokensRemaining: balance };
}
