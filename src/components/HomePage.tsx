"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SeeItStrip } from "@/components/SeeItStrip";
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

        <section id="create" className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="text-center sm:text-left">
              <p className="text-xs uppercase tracking-[0.25em] text-accent-secondary">
                Motion Studio
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Bring your tattoo to life
              </h2>
              <p className="mt-2 text-sm text-muted">
                Upload a photo and animate it into a short 5–10s cinematic clip.
              </p>
            </div>

            <SeeItStrip variant="motion" />

            <MotionStudio />
          </div>
        </section>

        <section className="border-t border-border px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="text-center sm:text-left">
              <p className="text-xs uppercase tracking-[0.25em] text-accent">
                Also available · Movie Mode
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Turn your tattoo into a story
              </h2>
              <p className="mt-2 text-sm text-muted">
                Tell the story behind your ink and generate a multi-scene comic panel sequence.
              </p>
            </div>

            <SeeItStrip variant="story" />

            <ComicBook />
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted sm:px-6">
        <p>Ink-N-Motion</p>
      </footer>
    </>
  );
}
