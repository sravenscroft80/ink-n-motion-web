"use client";

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <div className="mx-auto max-w-3xl space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted">
          Movie scenes & motion for tattoo art
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="gradient-text">Watch your tattoo</span>
            <br />
            come to life
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Turn any tattoo into a multi-scene movie story — then bring scenes
            to life with motion. Pick from 12 style packs and create in
            seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
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

        <div className="flex flex-wrap gap-6 pt-2 text-sm text-muted">
          <span>✦ Multi-scene stories</span>
          <span>✦ 12 style packs</span>
          <span>✦ Bring scenes to life</span>
        </div>
      </div>
    </section>
  );
}
