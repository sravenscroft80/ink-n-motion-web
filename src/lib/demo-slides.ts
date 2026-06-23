export interface DemoSlideFrame {
  /** Path under /public, e.g. /demo/butterfly-before.svg */
  src: string;
  alt: string;
  /** Fallback gradient when image is missing (Tailwind gradient classes) */
  gradient?: string;
  /** When true, render as a looping muted video instead of an image */
  isVideo?: boolean;
}

export interface DemoSlide {
  id: string;
  caption: string;
  before: DemoSlideFrame;
  after: DemoSlideFrame;
  /** Optional future animated (video) frame — shown only when src is set */
  animated?: DemoSlideFrame;
}

/**
 * Demo slideshow data. To go live with real photos:
 * 1. Drop images into /public/demo/
 * 2. Update the `src` paths below (keep the same filenames or change them here)
 */
export const DEMO_SLIDES: DemoSlide[] = [
  {
    id: "story-1",
    caption: "A tiny caterpillar inches along a green leaf",
    before: {
      src: "/demo/motion-before.jpg",
      alt: "Original butterfly tattoo photo",
      gradient: "from-amber-900/40 via-rose-900/30 to-zinc-900",
    },
    after: {
      src: "/demo/story-tattoo-1.png",
      alt: "Story scene 1 — caterpillar on a leaf",
      gradient: "from-violet-600/50 via-fuchsia-500/30 to-amber-400/40",
    },
  },
  {
    id: "story-2",
    caption: "It eats and grows, dreaming of one day flying",
    before: {
      src: "/demo/motion-before.jpg",
      alt: "Original butterfly tattoo photo",
      gradient: "from-amber-900/40 via-rose-900/30 to-zinc-900",
    },
    after: {
      src: "/demo/story-tattoo-2.png",
      alt: "Story scene 2 — growing and dreaming of flight",
      gradient: "from-sky-600/40 via-indigo-500/25 to-violet-500/30",
    },
  },
  {
    id: "story-3",
    caption: "It wraps itself inside a smooth golden chrysalis",
    before: {
      src: "/demo/motion-before.jpg",
      alt: "Original butterfly tattoo photo",
      gradient: "from-amber-900/40 via-rose-900/30 to-zinc-900",
    },
    after: {
      src: "/demo/story-tattoo-3.png",
      alt: "Story scene 3 — the chrysalis",
      gradient: "from-emerald-600/40 via-teal-500/25 to-zinc-700/30",
    },
  },
  {
    id: "story-4",
    caption: "A beautiful butterfly spreads its wings to the sky",
    before: {
      src: "/demo/motion-before.jpg",
      alt: "Original butterfly tattoo photo",
      gradient: "from-amber-900/40 via-rose-900/30 to-zinc-900",
    },
    after: {
      src: "/demo/story-tattoo-4.png",
      alt: "Story scene 4 — the butterfly emerges",
      gradient: "from-fuchsia-600/40 via-pink-500/25 to-amber-400/30",
    },
  },
];

export const MOTION_DEMO_SLIDE: DemoSlide = {
  id: "motion-butterfly",
  caption: "Butterfly tattoo → animated motion clip",
  before: {
    src: "/demo/motion-before.jpg",
    alt: "Original butterfly tattoo photo",
    gradient: "from-amber-900/40 via-rose-900/30 to-zinc-900",
  },
  after: {
    src: "/demo/motion-after.mp4",
    alt: "Butterfly tattoo animated into a short video",
    isVideo: true,
    gradient: "from-violet-600/50 via-fuchsia-500/30 to-amber-400/40",
  },
};
