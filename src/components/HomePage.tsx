"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SeeItStrip } from "@/components/SeeItStrip";
import { DemoPanel } from "@/components/DemoPanel";
import { MotionStudio } from "@/components/MotionStudio";
import ComicBook from "@/components/ComicBook";

interface HomePageProps {
  initialToast?: string | null;
  refreshTokensOnMount?: boolean;
}

export function HomePage({
  initialToast = null,
  refreshTokensOnMount = false,
}: HomePageProps) {
  const { user, refreshBalance } = useAuth();
  const [toast, setToast] = useState<string | null>(initialToast);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!refreshTokensOnMount || !user) {
      return;
    }

    void refreshBalance();
    const retrySoon = window.setTimeout(() => void refreshBalance(), 2500);
    const retryLater = window.setTimeout(() => void refreshBalance(), 6000);

    return () => {
      window.clearTimeout(retrySoon);
      window.clearTimeout(retryLater);
    };
  }, [refreshTokensOnMount, user, refreshBalance]);

  const scrollToCreate = () => {
    document.getElementById("create")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Header />

      {toast && (
        <div className="fixed right-4 top-20 z-50 max-w-sm rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      <main className="flex-1">
        <Hero onGetStarted={scrollToCreate} />
        <SeeItStrip />

        <section id="create" className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-accent">
                Creators
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Choose your mode
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted">
                Build multi-scene movie stories or animate a still with Motion
                Studio.
              </p>
            </div>

            <div className="space-y-12">
              <div className="grid items-stretch gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-accent">
                      Movie Mode
                    </p>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                      Turn your tattoo into a movie scene story
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      Upload your tattoo, tell its story, and generate styled
                      still scenes across 11 packs.
                    </p>
                  </div>

                  <ComicBook />
                </div>

                <DemoPanel
                  label="Movie Mode"
                  caption="Tattoo → Movie scene"
                  videoSrc="/demo/movie-mode.mp4"
                />
              </div>

              <div className="grid items-stretch gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-accent-secondary">
                      Motion Studio
                    </p>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                      Bring your image to life with motion
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      Turn a still into a short 5–10s video with motion.
                    </p>
                  </div>

                  <MotionStudio />
                </div>

                <DemoPanel
                  label="Motion Studio"
                  caption="Tattoo → 10s video"
                  videoSrc="/demo/motion-studio.mp4"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted sm:px-6">
        <p>Ink-N-Motion · Movie Mode + Motion Studio · Built for Vercel</p>
      </footer>
    </>
  );
}
