"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatTokenCost } from "@/lib/format-tokens";
import {
  TOKEN_PACK_LIST,
  type TokenPackKey,
} from "@/lib/token-packs";

export function PricingPackCards() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authLoading } = useAuth();
  const [loadingPack, setLoadingPack] = useState<TokenPackKey | null>(null);
  const [error, setError] = useState<string | null>(() =>
    searchParams.get("purchase") === "cancelled"
      ? "Checkout cancelled — no charge was made."
      : null,
  );

  async function handleBuy(packKey: TokenPackKey) {
    setError(null);

    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/pricing")}`);
      return;
    }

    setLoadingPack(packKey);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: packKey }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/pricing")}`);
        return;
      }

      if (!response.ok || !data.url) {
        setError(data.error || "Unable to start checkout. Please try again.");
        return;
      }

      globalThis.location.assign(data.url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <>
      {error && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {TOKEN_PACK_LIST.map((pack) => (
          <div
            key={pack.key}
            className={`glass-panel relative rounded-3xl p-6 ${
              pack.badge ? "border-accent/40" : ""
            }`}
          >
            {pack.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                {pack.badge}
              </span>
            )}
            <h2 className="text-lg font-semibold text-white">{pack.name}</h2>
            <p className="mt-2 text-3xl font-bold text-white">
              ${pack.priceUsd.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-muted">
              {formatTokenCost(pack.tokens)} · 60-day expiry
            </p>
            <button
              type="button"
              onClick={() => void handleBuy(pack.key)}
              disabled={authLoading || loadingPack === pack.key}
              className="btn-primary mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loadingPack === pack.key
                ? "Redirecting…"
                : authLoading
                  ? "Loading…"
                  : user
                    ? "Buy"
                    : "Log in to buy"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
