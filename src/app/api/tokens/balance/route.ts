import { NextResponse } from "next/server";
import { bootstrapAuthenticatedUser } from "@/lib/auth/bootstrap-user";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { getSpendableBalance } from "@/lib/tokens";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Token system not configured." },
      { status: 503 },
    );
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { signupBonusGranted } = await bootstrapAuthenticatedUser(userId);
    const balance = await getSpendableBalance(userId);

    return NextResponse.json({
      balance,
      signupBonusGranted,
    });
  } catch (error) {
    console.error("Token balance error:", error);
    return NextResponse.json(
      { error: "Unable to load token balance." },
      { status: 500 },
    );
  }
}
