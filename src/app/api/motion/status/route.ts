import { NextResponse } from "next/server";
import { getGenerationErrorResponse } from "@/lib/generation-errors";
import { requireAuthenticatedUser } from "@/lib/generation-guard";
import { isReplicateConfigured } from "@/lib/replicate";
import { getPredictionResult } from "@/lib/replicate-runner";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const predictionId = searchParams.get("id")?.trim();

  if (!predictionId) {
    return NextResponse.json(
      { error: "A prediction id is required." },
      { status: 400 },
    );
  }

  try {
    const result = await getPredictionResult(predictionId, "replicate_poll");

    if (result.status === "succeeded") {
      return NextResponse.json({
        status: result.status,
        videoUrl: result.output,
      });
    }

    if (result.status === "failed") {
      return NextResponse.json({
        status: result.status,
        error: result.error ?? "Video generation failed",
      });
    }

    return NextResponse.json({ status: result.status });
  } catch (error) {
    const { message, stage, status } = getGenerationErrorResponse(error);

    return NextResponse.json(
      {
        status: "failed",
        error: message,
        stage,
      },
      { status },
    );
  }
}
