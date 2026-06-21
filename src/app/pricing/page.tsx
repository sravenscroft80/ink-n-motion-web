import Link from "next/link";
import { TOKEN_PACKS } from "@/lib/token-packs";
import { formatTokenCost } from "@/lib/format-tokens";

export default function PricingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border/80 glass-panel">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-secondary text-sm font-bold text-white shadow-lg shadow-accent/30">
              IN
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              Ink-N-Motion
            </span>
          </Link>
          <Link
            href="/login"
            className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-white"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">
            Token packs
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Buy tokens
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
            One-time packs — no subscription. Stripe checkout arrives in the
            next release; preview pricing below.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {TOKEN_PACKS.map((pack) => (
            <div
              key={pack.id}
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
                disabled
                className="btn-primary mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white opacity-60"
              >
                Coming soon
              </button>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-md text-center text-xs text-muted">
          New accounts receive 3 free tokens after email confirmation.
        </p>
      </main>
    </div>
  );
}
