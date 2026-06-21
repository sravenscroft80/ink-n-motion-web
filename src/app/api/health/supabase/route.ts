import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getSpendableBalance } from "@/lib/tokens";

export const runtime = "nodejs";

/** Dev/setup check: confirms env vars + RPC connectivity. */
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
      },
      { status: 503 },
    );
  }

  const probeUserId = "00000000-0000-0000-0000-000000000000";

  try {
    const balance = await getSpendableBalance(probeUserId);

    return NextResponse.json({
      ok: true,
      message: "Supabase connected; get_spendable_balance RPC responded.",
      probeUserId,
      balance,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Supabase error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint:
          "If keys look wrong, use Publishable + Secret from Settings → API Keys, or legacy anon + service_role JWTs.",
      },
      { status: 502 },
    );
  }
}
