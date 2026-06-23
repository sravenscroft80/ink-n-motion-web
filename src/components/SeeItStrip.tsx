import { DemoSlideshow } from "@/components/DemoSlideshow";
import { DEMO_SLIDES, MOTION_DEMO_SLIDE } from "@/lib/demo-slides";

interface SeeItStripProps {
  variant?: "story" | "motion";
}

export function SeeItStrip({ variant = "story" }: SeeItStripProps) {
  const isMotion = variant === "motion";

  return (
    <section
      id={isMotion ? "examples" : undefined}
      className="px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">
              {isMotion ? "See it in motion" : "See it"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {isMotion ? "From tattoo to moving clip" : "From skin to story panel"}
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted">
            {isMotion ? "A real example." : "A real example."}
          </p>
        </div>

        <DemoSlideshow
          slides={isMotion ? [MOTION_DEMO_SLIDE] : DEMO_SLIDES}
        />
      </div>
    </section>
  );
}
