import { NextResponse } from "next/server";
import {
  isComicStyle,
  MAX_PAGES,
  MIN_PAGES,
} from "@/lib/comic-config";
import { generateComic } from "@/lib/comic-generate";
import { addCredits, deductCredits, getCredits } from "@/lib/credits";
import {
  getGenerationErrorResponse,
  logGenerationFailure,
} from "@/lib/generation-errors";
import { isReplicateConfigured } from "@/lib/replicate";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ComicRequestBody {
  imageUrl?: string;
  story?: string;
  style?: string;
  pages?: number;
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

  let body: ComicRequestBody;

  try {
    body = (await request.json()) as ComicRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { imageUrl, story, style, pages }." },
      { status: 400 },
    );
  }

  const { imageUrl, story, style, pages } = body;

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
        error:
          'style must be one of: "classic-comic", "manga", "noir".',
      },
      { status: 400 },
    );
  }

  const pageCount = Number(pages);
  if (
    !Number.isInteger(pageCount) ||
    pageCount < MIN_PAGES ||
    pageCount > MAX_PAGES
  ) {
    return NextResponse.json(
      { error: `pages must be an integer between ${MIN_PAGES} and ${MAX_PAGES}.` },
      { status: 400 },
    );
  }

  const hasCredits = await deductCredits(pageCount);
  if (!hasCredits) {
    return NextResponse.json(
      {
        error: `Not enough credits. This comic requires ${pageCount} credit${pageCount === 1 ? "" : "s"}.`,
      },
      { status: 402 },
    );
  }

  try {
    const comic = await generateComic(
      imageUrl,
      story.trim(),
      style,
      pageCount,
    );

    const creditsRemaining = await getCredits();

    return NextResponse.json({ comic, creditsRemaining });
  } catch (error) {
    logGenerationFailure("comic", error);
    await addCredits(pageCount);

    const { message, stage, status } = getGenerationErrorResponse(error);

    return NextResponse.json({ error: message, stage }, { status });
  }
}
