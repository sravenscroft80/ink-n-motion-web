import { ensureSignupBonus } from "@/lib/tokens";
import { createAdminClient } from "@/lib/supabase/admin";

/** Ensure profile exists and grant signup bonus once (server-side, idempotent). */
export async function bootstrapAuthenticatedUser(userId: string): Promise<{
  signupBonusGranted: number;
  balance: number;
}> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({ id: userId });
  }

  const signupBonusGranted = await ensureSignupBonus(userId);

  const { data: balance, error } = await supabase.rpc("get_spendable_balance", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    signupBonusGranted,
    balance: typeof balance === "number" ? balance : 0,
  };
}
