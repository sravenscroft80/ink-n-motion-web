import Link from "next/link";
import { Suspense } from "react";
import { PricingPackCards } from "@/components/pricing/PricingPackCards";

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
            href="/login?next=%2Fpricing"
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
            One-time packs — no subscription. Tokens are added to your account
            after payment completes.
          </p>
        </div>

        <Suspense fallback={<div className="mt-10 text-center text-sm text-muted">Loading packs…</div>}>
          <PricingPackCards />
        </Suspense>

        <p className="mx-auto mt-8 max-w-md text-center text-xs text-muted">
          New accounts receive 3 free tokens after email confirmation.
        </p>
      </main>
    </div>
  );
}
