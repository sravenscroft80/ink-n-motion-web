import { createAdminClient } from "@/lib/supabase/admin";
import type { TokenPackKey } from "@/lib/token-packs";

export interface RecordStripeEventInput {
  eventId: string;
  eventType: string;
  checkoutSessionId: string | null;
  userId: string | null;
  pack: TokenPackKey | null;
  tokensGranted: number | null;
}

export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stripe_processed_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}

export async function isCheckoutSessionProcessed(
  checkoutSessionId: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stripe_processed_events")
    .select("id")
    .eq("checkout_session_id", checkoutSessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}

/** Returns true if this event was newly recorded; false if already processed. */
export async function recordStripeEventOnce(
  input: RecordStripeEventInput,
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stripe_processed_events")
    .insert({
      id: input.eventId,
      event_type: input.eventType,
      checkout_session_id: input.checkoutSessionId,
      user_id: input.userId,
      pack: input.pack,
      tokens_granted: input.tokensGranted,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return false;
    }
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}
