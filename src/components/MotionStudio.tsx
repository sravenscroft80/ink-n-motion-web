"use client";

import { useState } from "react";
import { STYLE_PACKS } from "@/lib/style-packs";
import type { StylePack } from "@/lib/types";

export function MotionStudio() {
  const [selectedStyle, setSelectedStyle] = useState<StylePack>("classic-comic");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileSelect(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="glass-panel space-y-5 rounded-3xl p-6 sm:p-8">
      <label
        htmlFor="motion-studio-upload"
        className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface/60 transition-colors hover:border-accent/50"
      >
        <input
          id="motion-studio-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            handleFileSelect(event.target.files?.[0] ?? null);
          }}
        />
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview for motion"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative z-10 rounded-full bg-black/60 px-4 py-2 text-sm text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              Change image
            </span>
          </>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-muted">
            Upload an image to animate into a short video
          </div>
        )}
      </label>

      <div className="space-y-2">
        <label
          htmlFor="motion-studio-style"
          className="text-sm font-medium text-white"
        >
          Style pack
        </label>
        <select
          id="motion-studio-style"
          value={selectedStyle}
          onChange={(event) => setSelectedStyle(event.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white outline-none transition-colors focus:border-accent/60"
        >
          {STYLE_PACKS.map((pack) => (
            <option key={pack.id} value={pack.id} className="bg-surface">
              {pack.label} — {pack.description}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        disabled
        className="btn-primary relative w-full rounded-full py-3.5 text-sm font-semibold text-white opacity-50"
      >
        <span className="flex items-center justify-center gap-2">
          Generate motion
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
            Coming soon
          </span>
        </span>
      </button>

      <p className="text-center text-xs text-muted">
        Short-form video generation is on the way — no tokens charged yet.
      </p>
    </div>
  );
}
