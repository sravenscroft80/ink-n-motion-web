import { DemoSlideshow } from "@/components/DemoSlideshow";

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
            Real tattoo photos transformed into comic-book stills — drop your
            own before/after pairs into{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-white/80">
              /public/demo/
            </code>{" "}
            to update the demo.
          </p>
        </div>

        <DemoSlideshow />
      </div>
    </section>
  );
}
