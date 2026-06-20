"use client";

import { useCallback, useEffect, useState } from "react";
import { DEMO_SLIDES, type DemoSlide, type DemoSlideFrame } from "@/lib/demo-slides";

const AUTO_PLAY_MS = 4500;

function FramePanel({
  frame,
  label,
}: {
  frame: DemoSlideFrame;
  label: "Before" | "After" | "Animated";
}) {
  const [imageError, setImageError] = useState(false);
  const showGradient = imageError && frame.gradient;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface aspect-[4/5] sm:aspect-[3/4]">
      <span className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/90 backdrop-blur-sm">
        {label}
      </span>

      {showGradient ? (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${frame.gradient}`}
          role="img"
          aria-label={frame.alt}
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={frame.src}
          alt={frame.alt}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

export function DemoSlideshow() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const slideCount = DEMO_SLIDES.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex((next + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (isPaused || reduceMotion || slideCount <= 1) {
      return;
    }
    const timer = window.setInterval(goNext, AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused, reduceMotion, slideCount]);

  return (
    <div
      className="glass-panel overflow-hidden rounded-3xl p-4 sm:p-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="relative min-h-[420px] sm:min-h-[380px]">
        {DEMO_SLIDES.map((slide, slideIndex) => (
          <SlideContent
            key={slide.id}
            slide={slide}
            isActive={slideIndex === index}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous demo slide"
          className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-white"
        >
          ← Prev
        </button>

        <div
          className="flex flex-1 items-center justify-center gap-2"
          role="tablist"
          aria-label="Demo slides"
        >
          {DEMO_SLIDES.map((slide, dotIndex) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={dotIndex === index}
              aria-label={`Go to slide ${dotIndex + 1}: ${slide.caption}`}
              onClick={() => goTo(dotIndex)}
              className={`h-2.5 rounded-full transition-all ${
                dotIndex === index
                  ? "w-8 bg-accent"
                  : "w-2.5 bg-white/20 hover:bg-white/35"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next demo slide"
          className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-white"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function SlideContent({
  slide,
  isActive,
  reduceMotion,
}: {
  slide: DemoSlide;
  isActive: boolean;
  reduceMotion: boolean;
}) {
  const transitionClass = reduceMotion
    ? isActive
      ? "relative opacity-100"
      : "pointer-events-none absolute inset-0 opacity-0"
    : isActive
      ? "relative translate-x-0 opacity-100 transition-all duration-700 ease-out"
      : "pointer-events-none absolute inset-0 translate-x-3 opacity-0 transition-all duration-700 ease-out";

  return (
    <article
      className={transitionClass}
      aria-hidden={!isActive}
      role="tabpanel"
    >
      <div
        className={`grid gap-4 ${
          slide.animated?.src
            ? "md:grid-cols-3"
            : "md:grid-cols-2"
        }`}
      >
        <FramePanel frame={slide.before} label="Before" />
        <FramePanel frame={slide.after} label="After" />
        {slide.animated?.src ? (
          <FramePanel frame={slide.animated} label="Animated" />
        ) : null}
      </div>
      <p className="mt-4 text-center text-sm text-muted sm:text-base">
        {slide.caption}
      </p>
    </article>
  );
}
