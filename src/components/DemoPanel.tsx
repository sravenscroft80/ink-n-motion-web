"use client";

import { useState } from "react";

interface DemoPanelProps {
  label: string;
  caption: string;
  videoSrc?: string;
}

export function DemoPanel({ label, caption, videoSrc }: DemoPanelProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = Boolean(videoSrc) && !videoFailed;

  return (
    <div className="relative h-full">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-accent/20 via-transparent to-accent-secondary/20 blur-2xl" />
      <div className="glass-panel relative h-full overflow-hidden rounded-[1.75rem] p-3 shadow-2xl shadow-black/40">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-surface-elevated lg:aspect-auto lg:min-h-[420px] lg:h-full">
          {showVideo ? (
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setVideoFailed(true)}
            />
          ) : (
            <>
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
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="mt-1 text-xs text-muted">{caption}</p>
                </div>
              </div>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{caption}</span>
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent">
                Live preview
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
