const EXAMPLES = [
  {
    title: "Classic Comic",
    gradient: "from-violet-600/40 via-fuchsia-500/20 to-amber-400/30",
    label: "Halftone pop art",
  },
  {
    title: "Manga",
    gradient: "from-zinc-400/30 via-zinc-700/40 to-white/10",
    label: "Ink & screentone",
  },
  {
    title: "Noir",
    gradient: "from-zinc-900 via-zinc-700/50 to-zinc-400/20",
    label: "High-contrast shadows",
  },
  {
    title: "Classic Comic",
    gradient: "from-indigo-600/30 via-purple-500/20 to-pink-500/30",
    label: "Bold panel energy",
  },
  {
    title: "Manga",
    gradient: "from-neutral-600/30 via-neutral-800/50 to-neutral-300/10",
    label: "Dynamic linework",
  },
];

export function SeeItStrip() {
  return (
    <section id="examples" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">
              See it
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              From skin to story panel
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted">
            Example placeholders — swap these with real before/after renders
            once you start generating.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {EXAMPLES.map((example, index) => (
            <article
              key={`${example.title}-${index}`}
              className="group overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div
                className={`relative aspect-[3/4] bg-gradient-to-br ${example.gradient}`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.75))]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 backdrop-blur-sm">
                    Example {index + 1}
                  </div>
                </div>
              </div>
              <div className="space-y-1 p-4">
                <h3 className="text-sm font-medium text-white">
                  {example.title}
                </h3>
                <p className="text-xs text-muted">{example.label}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
