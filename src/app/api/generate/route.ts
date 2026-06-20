import { NextResponse } from "next/server";
import { deductCredit, getCredits } from "@/lib/credits";
import { generateComicRender } from "@/lib/replicate";
import { isStylePack } from "@/lib/style-packs";
import type { StylePack } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface GenerateRequestBody {
  imageUrl?: string;
  stylePack?: string;
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
  if (!process.env.REPLICATE_API_TOKEN?.trim()) {
    return NextResponse.json(
      { error: "Generation not configured" },
      { status: 500 },
    );
  }

  let body: GenerateRequestBody;

  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { imageUrl, stylePack }." },
      { status: 400 },
    );
  }

  const { imageUrl, stylePack } = body;

  if (!imageUrl || typeof imageUrl !== "string" || !isValidImageUrl(imageUrl)) {
    return NextResponse.json(
      { error: "A valid imageUrl is required." },
      { status: 400 },
    );
  }

  if (!stylePack || !isStylePack(stylePack)) {
    return NextResponse.json(
      {
        error:
          'stylePack must be one of: "classic-comic", "manga", "noir".',
      },
      { status: 400 },
    );
  }

  const hasCredit = await deductCredit();
  if (!hasCredit) {
    return NextResponse.json(
      { error: "You are out of credits. Purchase more to continue generating." },
      { status: 402 },
    );
  }

  try {
    const outputUrl = await generateComicRender(imageUrl, stylePack as StylePack);
    const creditsRemaining = await getCredits();

    return NextResponse.json({ outputUrl, creditsRemaining });
  } catch (error) {
    console.error("Generate error:", error);
    const { addCredits } = await import("@/lib/credits");
    await addCredits(1);

    const message =
      error instanceof Error ? error.message : "Generation failed. Please try again.";

    const status = message.includes("timed out") ? 504 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
