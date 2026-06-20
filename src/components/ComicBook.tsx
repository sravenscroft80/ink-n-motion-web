"use client";

import { useState } from "react";
import {
  COMIC_STYLES,
  type Comic,
  type ComicStyle,
  MAX_PAGES,
  MIN_PAGES,
} from "@/lib/comic-config";

interface ComicBookProps {
  onCreditsChange?: (credits: number) => void;
}

export default function ComicBook({ onCreditsChange }: ComicBookProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [story, setStory] = useState("");
  const [style, setStyle] = useState<ComicStyle>("classic-comic");
  const [pages, setPages] = useState(MIN_PAGES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comic, setComic] = useState<Comic | null>(null);
  const [current, setCurrent] = useState(0);

  function handleFileChange(nextFile: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function generate() {
    if (!file || !story.trim()) {
      setError("Add a tattoo photo and tell us the story.");
      return;
    }

    setError("");
    setLoading(true);
    setComic(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) {
        const uploadError = (await up.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(uploadError.error || "Upload failed");
      }
      const { url } = (await up.json()) as { url: string };

      const res = await fetch("/api/comic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url, story, style, pages }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || "Generation failed");
      }

      const data = (await res.json()) as {
        comic: Comic;
        creditsRemaining?: number;
      };

      setComic(data.comic);
      setCurrent(0);

      if (typeof data.creditsRemaining === "number") {
        onCreditsChange?.(data.creditsRemaining);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="comic-book" className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Comic book</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Turn your tattoo into a comic book
        </h2>
        <p className="mt-3 text-sm text-muted sm:text-base">
          Upload your tattoo, tell its story, and we&apos;ll illustrate it page
          by page.
        </p>
      </div>

      {!comic && (
        <div className="glass-panel mt-8 space-y-5 rounded-3xl p-6 sm:p-8">
          <label
            htmlFor="comic-upload"
            className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface/60 transition-colors hover:border-accent/50"
          >
            <input
              id="comic-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
            {previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Tattoo preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative z-10 rounded-full bg-black/60 px-4 py-2 text-sm text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  Change photo
                </span>
              </>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-muted">
                Click to upload your tattoo photo
              </div>
            )}
          </label>

          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={4}
            placeholder="Tell us the story behind this tattoo. e.g. 'This was my late father — a black belt who taught me discipline. Tell his story.'"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-accent/60"
          />

          <div className="flex flex-col gap-4 sm:flex-row">
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as ComicStyle)}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white outline-none focus:border-accent/60"
            >
              {Object.entries(COMIC_STYLES).map(([key, value]) => (
                <option key={key} value={key} className="bg-surface">
                  {value.label}
                </option>
              ))}
            </select>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white sm:justify-center">
              <span className="text-muted">Pages</span>
              <input
                type="number"
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={pages}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setPages(
                    Math.min(MAX_PAGES, Math.max(MIN_PAGES, next || MIN_PAGES)),
                  );
                }}
                className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-center"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className="btn-primary w-full rounded-full py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Illustrating your story…"
              : `Generate comic (${pages} credit${pages === 1 ? "" : "s"})`}
          </button>
        </div>
      )}

      {comic && (
        <div className="mt-8">
          <h3 className="text-center text-2xl font-bold tracking-tight">
            {comic.title}
          </h3>

          <div className="glass-panel mt-4 overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={comic.pages[current].image}
              alt={`Page ${current + 1}`}
              className="w-full object-contain"
            />
            <p className="border-t border-border p-4 text-center text-sm text-muted sm:text-base">
              {comic.pages[current].caption}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="btn-secondary rounded-full px-5 py-2 text-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-muted">
              Page {current + 1} / {comic.pages.length}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrent((c) => Math.min(comic.pages.length - 1, c + 1))
              }
              disabled={current === comic.pages.length - 1}
              className="btn-secondary rounded-full px-5 py-2 text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <a
              href={comic.pages[current].image}
              download
              className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white"
            >
              Download page
            </a>
            <button
              type="button"
              onClick={() => {
                setComic(null);
                setCurrent(0);
              }}
              className="btn-secondary rounded-full px-5 py-2 text-sm"
            >
              New comic
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
