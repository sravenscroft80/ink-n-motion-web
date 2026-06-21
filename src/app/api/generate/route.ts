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
import { generateComicRender, isReplicateConfigured } from "@/lib/replicate";
import { parseIsolateFlag } from "@/lib/parse-isolate";
import { isStylePack } from "@/lib/style-packs";
import { getStyleStillAction, getStyleStillCost } from "@/lib/token-costs";
import { refundTokens, spendTokens } from "@/lib/tokens";
import type { StylePack } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface GenerateRequestBody {
  imageUrl?: string;
  stylePack?: string;
  isolate?: unknown;
}

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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

  let body: GenerateRequestBody;

  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { imageUrl, stylePack, isolate? }." },
      { status: 400 },
    );
  }

  const { imageUrl, stylePack, isolate: isolateRaw } = body;

  const isolate = parseIsolateFlag(isolateRaw);
  if (isolate === null) {
    return NextResponse.json(
      { error: "isolate must be a boolean when provided." },
      { status: 400 },
    );
  }

  if (!imageUrl || typeof imageUrl !== "string" || !isValidImageUrl(imageUrl)) {
    return NextResponse.json(
      { error: "A valid imageUrl is required." },
      { status: 400 },
    );
  }

  if (!stylePack || !isStylePack(stylePack)) {
    return NextResponse.json(
      {
        error: "stylePack must be a valid style id.",
      },
      { status: 400 },
    );
  }

  const action = getStyleStillAction();
  const tokenCost = getStyleStillCost();

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
    const outputUrl = await generateComicRender(imageUrl, stylePack as StylePack, {
      isolate,
    });

    return NextResponse.json({
      outputUrl,
      ...(await tokensRemainingPayload(userId)),
    });
  } catch (error) {
    logGenerationFailure("generate", error);

    try {
      await refundTokens(userId, spendBatchId, action);
    } catch (refundError) {
      console.error("Generate token refund failed:", refundError);
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
