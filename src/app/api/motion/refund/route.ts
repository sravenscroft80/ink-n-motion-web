import { NextResponse } from "next/server";
import {
  requireAuthenticatedUser,
  tokensRemainingPayload,
} from "@/lib/generation-guard";
import { resolveVideoAction } from "@/lib/motion-api";
import { refundTokens } from "@/lib/tokens";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MotionRefundRequestBody {
  spendBatchId?: string;
  durationSeconds?: number;
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth instanceof NextResponse) {
    return auth;
  }
  const { userId } = auth;

  let body: MotionRefundRequestBody;

  try {
    body = (await request.json()) as MotionRefundRequestBody;
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid JSON body. Expected { spendBatchId, durationSeconds }.",
      },
      { status: 400 },
    );
  }

  const { spendBatchId, durationSeconds: durationRaw } = body;

  if (!spendBatchId || typeof spendBatchId !== "string") {
    return NextResponse.json(
      { error: "A valid spendBatchId is required." },
      { status: 400 },
    );
  }

  const durationSeconds = Number(durationRaw);
  const action = resolveVideoAction(durationSeconds);
  if (!action) {
    return NextResponse.json(
      { error: "durationSeconds must be 5 or 10." },
      { status: 400 },
    );
  }

  try {
    await refundTokens(userId, spendBatchId, action);
  } catch (refundError) {
    console.error("Motion refund request failed:", refundError);
  }

  return NextResponse.json({
    refunded: true,
    ...(await tokensRemainingPayload(userId)),
  });
}
