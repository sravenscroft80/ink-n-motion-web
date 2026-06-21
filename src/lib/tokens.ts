import {
  TOKEN_EXPIRY_DAYS,
  type TokenAction,
  getTokenCost,
} from "@/lib/token-costs";
import { createAdminClient } from "@/lib/supabase/admin";

export type TokenGrantSource = "signup_bonus" | "purchase" | "refund" | "admin";

export type TokenLedgerEntryType = "grant" | "spend" | "refund" | "expire";

export interface TokenLedgerEntry {
  id: string;
  userId: string;
  entryType: TokenLedgerEntryType;
  amount: number;
  action: string | null;
  grantId: string | null;
  stripeCheckoutSessionId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export class InsufficientTokensError extends Error {
  readonly code = "insufficient_tokens" as const;
  readonly required: number;
  readonly available: number;

  constructor(required: number, available: number) {
    super(
      `Insufficient tokens: need ${required}, have ${available} spendable.`,
    );
    this.name = "InsufficientTokensError";
    this.required = required;
    this.available = available;
  }
}

export class TokenOperationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "TokenOperationError";
    this.code = code;
  }
}

function expiryDateFromNow(days = TOKEN_EXPIRY_DAYS): string {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + days);
  return expires.toISOString();
}

function mapRpcError(error: { message?: string; code?: string }): never {
  const message = error.message ?? "Token operation failed.";

  if (message.includes("insufficient_tokens")) {
    throw new TokenOperationError("insufficient_tokens", message);
  }

  if (message.includes("spend_batch_not_found")) {
    throw new TokenOperationError("spend_batch_not_found", message);
  }

  throw new TokenOperationError(error.code ?? "token_error", message);
}

export async function getSpendableBalance(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_spendable_balance", {
    p_user_id: userId,
  });

  if (error) {
    mapRpcError(error);
  }

  return typeof data === "number" ? data : 0;
}

export interface GrantTokensOptions {
  expiresAt?: string;
  packId?: string | null;
  stripeCheckoutSessionId?: string | null;
  action?: string | null;
}

export async function grantTokens(
  userId: string,
  amount: number,
  source: TokenGrantSource,
  options: GrantTokensOptions = {},
): Promise<string> {
  if (amount <= 0) {
    throw new TokenOperationError(
      "invalid_amount",
      "Grant amount must be positive.",
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("grant_tokens", {
    p_user_id: userId,
    p_amount: amount,
    p_source: source,
    p_expires_at: options.expiresAt ?? expiryDateFromNow(),
    p_pack_id: options.packId ?? null,
    p_stripe_checkout_session_id: options.stripeCheckoutSessionId ?? null,
    p_action: options.action ?? null,
  });

  if (error) {
    mapRpcError(error);
  }

  if (typeof data !== "string") {
    throw new TokenOperationError(
      "grant_failed",
      "grant_tokens did not return a grant id.",
    );
  }

  return data;
}

export interface SpendTokensResult {
  spendBatchId: string;
  cost: number;
  balanceAfter: number;
}

export async function spendTokens(
  userId: string,
  action: TokenAction,
  costOverride?: number,
): Promise<SpendTokensResult> {
  const cost = costOverride ?? getTokenCost(action);

  if (cost <= 0) {
    const balanceAfter = await getSpendableBalance(userId);
    return { spendBatchId: crypto.randomUUID(), cost: 0, balanceAfter };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("spend_tokens", {
    p_user_id: userId,
    p_action: action,
    p_cost: cost,
  });

  if (error) {
    if (error.message?.includes("insufficient_tokens")) {
      const balance = await getSpendableBalance(userId);
      throw new InsufficientTokensError(cost, balance);
    }
    mapRpcError(error);
  }

  if (typeof data !== "string") {
    throw new TokenOperationError(
      "spend_failed",
      "spend_tokens did not return a spend batch id.",
    );
  }

  const balanceAfter = await getSpendableBalance(userId);

  return {
    spendBatchId: data,
    cost,
    balanceAfter,
  };
}

export async function refundTokens(
  userId: string,
  spendBatchId: string,
  action?: TokenAction,
): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("refund_tokens", {
    p_user_id: userId,
    p_spend_batch: spendBatchId,
    p_action: action ?? null,
  });

  if (error) {
    mapRpcError(error);
  }

  return typeof data === "number" ? data : 0;
}

/** Grant 3 signup tokens once per user. Returns tokens granted (0 if already claimed). */
export async function ensureSignupBonus(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("ensure_signup_bonus", {
    p_user_id: userId,
  });

  if (error) {
    mapRpcError(error);
  }

  return typeof data === "number" ? data : 0;
}

export async function getTokenHistory(
  userId: string,
  limit = 50,
): Promise<TokenLedgerEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("token_ledger")
    .select(
      "id, user_id, entry_type, amount, action, grant_id, stripe_checkout_session_id, metadata, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    mapRpcError(error);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    entryType: row.entry_type as TokenLedgerEntryType,
    amount: row.amount,
    action: row.action,
    grantId: row.grant_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}
