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
    id: "butterfly-classic",
    caption: "Butterfly tattoo → Classic Comic page",
    before: {
      src: "/demo/butterfly-before.svg",
      alt: "Butterfly tattoo on forearm before stylization",
      gradient: "from-amber-900/40 via-rose-900/30 to-zinc-900",
    },
    after: {
      src: "/demo/butterfly-after.svg",
      alt: "Butterfly tattoo rendered in classic comic style",
      gradient: "from-violet-600/50 via-fuchsia-500/30 to-amber-400/40",
    },
  },
  {
    id: "dragon-manga",
    caption: "Dragon sleeve → Manga ink panel",
    before: {
      src: "/demo/dragon-before.svg",
      alt: "Dragon tattoo on arm before stylization",
      gradient: "from-zinc-800/60 via-stone-700/40 to-zinc-900",
    },
    after: {
      src: "/demo/dragon-after.svg",
      alt: "Dragon tattoo rendered in manga style",
      gradient: "from-zinc-500/30 via-zinc-800/50 to-white/10",
    },
  },
  {
    id: "rose-noir",
    caption: "Rose tattoo → Noir story frame",
    before: {
      src: "/demo/rose-before.svg",
      alt: "Rose tattoo before stylization",
      gradient: "from-rose-950/50 via-zinc-800/40 to-black",
    },
    after: {
      src: "/demo/rose-after.svg",
      alt: "Rose tattoo rendered in noir style",
      gradient: "from-zinc-900 via-zinc-700/60 to-zinc-400/20",
    },
  },
  {
    id: "wolf-classic",
    caption: "Wolf tattoo → Classic Comic still",
    before: {
      src: "/demo/wolf-before.svg",
      alt: "Wolf tattoo on shoulder before stylization",
      gradient: "from-orange-950/40 via-zinc-800/50 to-zinc-950",
    },
    after: {
      src: "/demo/wolf-after.svg",
      alt: "Wolf tattoo rendered in classic comic style",
      gradient: "from-indigo-600/40 via-purple-500/25 to-pink-500/30",
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
