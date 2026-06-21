"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

function formatEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) {
    return email;
  }
  if (local.length <= 14) {
    return email;
  }
  return `${local.slice(0, 12)}…@${domain}`;
}

export function Header() {
  const {
    user,
    tokens,
    authLoading,
    balanceLoading,
    signOut,
    isAuthEnabled,
  } = useAuth();

  const showAuth = isAuthEnabled;

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 glass-panel">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-secondary text-sm font-bold text-white shadow-lg shadow-accent/30">
            IN
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Ink-N-Motion
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="hidden rounded-full border border-border px-3 py-1.5 text-sm text-muted lg:block">
            Movie Mode + Motion Studio
          </div>

          {showAuth && !authLoading && !user && (
            <>
              <Link
                href="/login"
                className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-primary rounded-full px-4 py-2 text-sm font-medium text-white"
              >
                Sign up
              </Link>
            </>
          )}

          {showAuth && user && (
            <>
              <div
                className="hidden max-w-[180px] truncate rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted sm:block"
                title={user.email ?? undefined}
              >
                {user.email ? formatEmail(user.email) : "Account"}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-surface px-3 py-1.5 text-sm">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
                <span className="text-muted">Tokens</span>
                <span className="font-semibold text-white">
                  {balanceLoading && tokens === null
                    ? "…"
                    : (tokens ?? 0)}
                </span>
              </div>
              <Link
                href="/pricing"
                className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-white"
              >
                Buy tokens
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-white"
              >
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
