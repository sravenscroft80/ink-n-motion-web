"use client";

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="gradient-text">Watch your tattoo</span>
            <br />
            come to life
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Turn any tattoo into a multi-scene story, then animate it into motion. 12 style packs, ready in seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onGetStarted}
            className="btn-primary rounded-full px-7 py-3.5 text-sm font-semibold text-white"
          >
            Start creating
          </button>
          <a
            href="#examples"
            className="text-sm font-medium text-muted transition-colors hover:text-white"
          >
            See examples ↓
          </a>
        </div>
      </div>
    </section>
  );
}
