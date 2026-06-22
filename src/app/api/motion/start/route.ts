import { NextResponse } from "next/server";
import {
  getGenerationErrorResponse,
  logGenerationFailure,
} from "@/lib/generation-errors";
import {
  handleInsufficientTokens,
  requireAuthenticatedUser,
  tokensRemainingPayload,
} from "@/lib/generation-guard";
import {
  getVideoTokenCost,
  isValidImageUrl,
  resolveVideoAction,
} from "@/lib/motion-api";
import { isReplicateConfigured } from "@/lib/replicate";
import { refundTokens, spendTokens } from "@/lib/tokens";
import { startVideoGeneration } from "@/lib/video-generate";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MotionStartRequestBody {
  imageUrl?: string;
  durationSeconds?: number;
  prompt?: string;
}

export async function POST(request: Request) {
  if (!isReplicateConfigured()) {
    return NextResponse.json(
      { error: "Generation not configured", stage: "replicate_create" },
      { status: 500 },
    );
  }

  const auth = await requireAuthenticatedUser();
  if (auth instanceof NextResponse) {
    return auth;
  }
  const { userId } = auth;

  let body: MotionStartRequestBody;

  try {
    body = (await request.json()) as MotionStartRequestBody;
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid JSON body. Expected { imageUrl, durationSeconds, prompt? }.",
      },
      { status: 400 },
    );
  }

  const { imageUrl, durationSeconds: durationRaw, prompt } = body;

  if (!imageUrl || typeof imageUrl !== "string" || !isValidImageUrl(imageUrl)) {
    return NextResponse.json(
      { error: "A valid imageUrl is required." },
      { status: 400 },
    );
  }

  if (prompt !== undefined && typeof prompt !== "string") {
    return NextResponse.json(
      { error: "prompt must be a string when provided." },
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

  const tokenCost = getVideoTokenCost(durationSeconds);
  if (tokenCost === null) {
    return NextResponse.json(
      { error: "durationSeconds must be 5 or 10." },
      { status: 400 },
    );
  }

  let spendBatchId: string;

  try {
    const spend = await spendTokens(userId, action, tokenCost);
    spendBatchId = spend.spendBatchId;
  } catch (error) {
    const insufficient = await handleInsufficientTokens(error, tokenCost);
    if (insufficient) {
      return insufficient;
    }
    throw error;
  }

  try {
    const predictionId = await startVideoGeneration(
      imageUrl,
      durationSeconds as 5 | 10,
      typeof prompt === "string" ? prompt : undefined,
    );

    return NextResponse.json({
      predictionId,
      spendBatchId,
      durationSeconds,
      ...(await tokensRemainingPayload(userId)),
    });
  } catch (error) {
    logGenerationFailure("motion/start", error);

    try {
      await refundTokens(userId, spendBatchId, action);
    } catch (refundError) {
      console.error("Motion start token refund failed:", refundError);
    }

    const { message, stage, status } = getGenerationErrorResponse(error);

    return NextResponse.json(
      {
        error: message,
        stage,
        refunded: true,
        ...(await tokensRemainingPayload(userId)),
      },
      { status },
    );
  }
}
