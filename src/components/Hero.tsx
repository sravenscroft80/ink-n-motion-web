"use client";

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-8">
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
              to life with motion. Pick from 11 style packs and create in
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
            <span>✦ 11 style packs</span>
            <span>✦ Bring scenes to life</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-accent/20 via-transparent to-accent-secondary/20 blur-2xl" />
          <div className="glass-panel relative overflow-hidden rounded-[1.75rem] p-3 shadow-2xl shadow-black/40">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-surface-elevated">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,92,255,0.25),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,77,141,0.18),transparent_40%),linear-gradient(180deg,#12121c,#0a0a12)]" />

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <svg
                    className="h-7 w-7 text-accent"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Demo loop placeholder
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Replace with your hero demo video on Vercel
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Tattoo → Movie scene</span>
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent">
                    Live preview
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
