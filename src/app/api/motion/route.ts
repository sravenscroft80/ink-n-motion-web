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
import { isReplicateConfigured } from "@/lib/replicate";
import {
  TOKEN_ACTIONS,
  getTokenCost,
  type TokenAction,
} from "@/lib/token-costs";
import { refundTokens, spendTokens } from "@/lib/tokens";
import { generateVideo } from "@/lib/video-generate";

export const runtime = "nodejs";
export const maxDuration = 300;

interface MotionRequestBody {
  imageUrl?: string;
  durationSeconds?: number;
  prompt?: string;
}

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveVideoAction(durationSeconds: number): TokenAction | null {
  if (durationSeconds === 5) {
    return TOKEN_ACTIONS.video_5s;
  }
  if (durationSeconds === 10) {
    return TOKEN_ACTIONS.video_10s;
  }
  return null;
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

  let body: MotionRequestBody;

  try {
    body = (await request.json()) as MotionRequestBody;
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

  const durationSeconds = Number(durationRaw);
  const action = resolveVideoAction(durationSeconds);
  if (!action) {
    return NextResponse.json(
      { error: "durationSeconds must be 5 or 10." },
      { status: 400 },
    );
  }

  const tokenCost = getTokenCost(action);

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
    const videoUrl = await generateVideo(
      imageUrl,
      durationSeconds as 5 | 10,
      typeof prompt === "string" ? prompt : undefined,
    );

    return NextResponse.json({
      videoUrl,
      ...(await tokensRemainingPayload(userId)),
    });
  } catch (error) {
    logGenerationFailure("motion", error);

    try {
      await refundTokens(userId, spendBatchId, action);
    } catch (refundError) {
      console.error("Motion token refund failed:", refundError);
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
