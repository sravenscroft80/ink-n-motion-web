import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is deprecated. Use POST /api/motion/start with client polling via GET /api/motion/status.",
    },
    { status: 410 },
  );
}
