"use client";

interface HeaderProps {
  credits: number;
  onBuyCredits: () => void;
  isCheckoutLoading?: boolean;
}

export function Header({
  credits,
  onBuyCredits,
  isCheckoutLoading = false,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 glass-panel">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-secondary text-sm font-bold text-white shadow-lg shadow-accent/30">
            IN
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Ink-N-Motion
          </span>
        </a>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden rounded-full border border-border px-3 py-1.5 text-sm text-muted sm:block">
            Comic stills · v1
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-muted">Credits</span>
            <span className="font-semibold text-white">{credits}</span>
          </div>
          <button
            type="button"
            onClick={onBuyCredits}
            disabled={isCheckoutLoading}
            className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isCheckoutLoading ? "Loading…" : "Buy credits"}
          </button>
        </div>
      </div>
    </header>
  );
}
