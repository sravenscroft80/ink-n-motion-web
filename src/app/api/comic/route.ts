import { NextResponse } from "next/server";
import {
  isAllowedPageCount,
  isComicStyle,
} from "@/lib/comic-config";
import { generateComic } from "@/lib/comic-generate";
import {
  getGenerationErrorResponse,
  logGenerationFailure,
} from "@/lib/generation-errors";
import {
  handleInsufficientTokens,
  requireAuthenticatedUser,
  tokensRemainingPayload,
} from "@/lib/generation-guard";
import { parseIsolateFlag } from "@/lib/parse-isolate";
import { isReplicateConfigured } from "@/lib/replicate";
import {
  getComicPageAction,
  getComicPageCost,
} from "@/lib/token-costs";
import { refundTokens, spendTokens } from "@/lib/tokens";

export const runtime = "nodejs";
export const maxDuration = 300;

interface ComicRequestBody {
  imageUrl?: string;
  story?: string;
  style?: string;
  pages?: number;
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

  let body: ComicRequestBody;

  try {
    body = (await request.json()) as ComicRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { imageUrl, story, style, pages, isolate? }." },
      { status: 400 },
    );
  }

  const { imageUrl, story, style, pages, isolate: isolateRaw } = body;

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

  if (!story || typeof story !== "string" || !story.trim()) {
    return NextResponse.json(
      { error: "A story is required." },
      { status: 400 },
    );
  }

  if (!style || !isComicStyle(style)) {
    return NextResponse.json(
      {
        error: "style must be a valid style id.",
      },
      { status: 400 },
    );
  }

  const pageCount = Number(pages);
  if (!Number.isInteger(pageCount) || !isAllowedPageCount(pageCount)) {
    return NextResponse.json(
      { error: "pages must be 3 or 5." },
      { status: 400 },
    );
  }

  const action = getComicPageAction(isolate);
  const tokenCost = getComicPageCost(isolate) * pageCount;

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
    const comic = await generateComic(
      imageUrl,
      story.trim(),
      style,
      pageCount,
      isolate,
    );

    return NextResponse.json({
      comic,
      ...(await tokensRemainingPayload(userId)),
    });
  } catch (error) {
    logGenerationFailure("comic", error);

    try {
      await refundTokens(userId, spendBatchId, action);
    } catch (refundError) {
      console.error("Comic token refund failed:", refundError);
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
