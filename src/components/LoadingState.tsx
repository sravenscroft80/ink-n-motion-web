"use client";

interface LoadingStateProps {
  styleLabel: string;
}

export function LoadingState({ styleLabel }: LoadingStateProps) {
  return (
    <section className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="glass-panel flex flex-col items-center rounded-3xl px-6 py-16 text-center sm:px-10">
          <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-accent/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin-slow" />
            <span className="text-lg font-bold text-accent">IN</span>
          </div>

          <h3 className="text-xl font-semibold text-white">
            Bringing your tattoo to life…
          </h3>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Applying the <span className="text-white">{styleLabel}</span> style
            pack. This usually takes 15–45 seconds on Vercel.
          </p>

          <div className="mt-8 flex gap-2">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-2 w-2 rounded-full bg-accent animate-pulse-glow"
                style={{ animationDelay: `${dot * 0.25}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
