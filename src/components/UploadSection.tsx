"use client";

import Link from "next/link";
import { STYLE_PACKS } from "@/lib/style-packs";
import type { StylePack } from "@/lib/types";
import { formatGenerateLabel } from "@/lib/format-tokens";
import {
  TattooRenderModeToggle,
  type TattooRenderMode,
} from "@/components/TattooRenderModeToggle";

interface UploadSectionProps {
  selectedStyle: StylePack;
  onStyleChange: (style: StylePack) => void;
  renderMode: TattooRenderMode;
  onRenderModeChange: (mode: TattooRenderMode) => void;
  previewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isLoggedIn: boolean;
  authLoading: boolean;
  tokens: number | null;
  tokenCost: number;
}

export function UploadSection({
  selectedStyle,
  onStyleChange,
  renderMode,
  onRenderModeChange,
  previewUrl,
  onFileSelect,
  onGenerate,
  isGenerating,
  isLoggedIn,
  authLoading,
  tokens,
  tokenCost,
}: UploadSectionProps) {
  const hasEnoughTokens = (tokens ?? 0) >= tokenCost;
  const canGenerate =
    Boolean(previewUrl) && isLoggedIn && hasEnoughTokens && !isGenerating;

  function buttonLabel(): string {
    if (isGenerating) {
      return "Generating…";
    }
    if (authLoading) {
      return "Loading account…";
    }
    if (!previewUrl) {
      return formatGenerateLabel(tokenCost, "Generate");
    }
    if (!isLoggedIn) {
      return "Log in to create";
    }
    if (!hasEnoughTokens) {
      return "Not enough tokens";
    }
    return formatGenerateLabel(tokenCost, "Generate comic still");
  }

  return (
    <section id="create" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">
            Create
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Upload your tattoo
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
            Drop a clear photo, pick a style pack, and generate a comic still.
            Each still costs {tokenCost} token{tokenCost === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="glass-panel space-y-6 rounded-3xl p-6 sm:p-8">
          <label
            htmlFor="tattoo-upload"
            className="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface/60 transition-colors hover:border-accent/50 hover:bg-surface"
          >
            <input
              id="tattoo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                onFileSelect(file);
              }}
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
                  Change image
                </span>
              </>
            ) : (
              <div className="space-y-3 px-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-elevated">
                  <svg
                    className="h-6 w-6 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">
                    Drag & drop or click to upload
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    JPG, PNG, WebP, or GIF · Max 10 MB
                  </p>
                </div>
              </div>
            )}
          </label>

          <div className="space-y-2">
            <label
              htmlFor="style-pack"
              className="text-sm font-medium text-white"
            >
              Style pack
            </label>
            <select
              id="style-pack"
              value={selectedStyle}
              onChange={(event) =>
                onStyleChange(event.target.value as StylePack)
              }
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white outline-none transition-colors focus:border-accent/60"
            >
              {STYLE_PACKS.map((pack) => (
                <option key={pack.id} value={pack.id} className="bg-surface">
                  {pack.label} — {pack.description}
                </option>
              ))}
            </select>
          </div>

          <TattooRenderModeToggle
            value={renderMode}
            onChange={onRenderModeChange}
            id="still-render-mode"
          />

          {!authLoading && !isLoggedIn && previewUrl && (
            <p className="text-center text-xs text-muted">
              <Link href="/login" className="text-accent hover:underline">
                Log in
              </Link>{" "}
              or{" "}
              <Link href="/signup" className="text-accent hover:underline">
                sign up free
              </Link>{" "}
              to generate ({tokenCost} token{tokenCost === 1 ? "" : "s"}).
            </p>
          )}

          {isLoggedIn && !hasEnoughTokens && (
            <p className="text-center text-xs text-muted">
              Not enough tokens.{" "}
              <Link href="/pricing" className="text-accent hover:underline">
                Buy tokens
              </Link>
            </p>
          )}

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate && !(previewUrl && !isLoggedIn)}
            className="btn-primary w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {buttonLabel()}
          </button>
        </div>
      </div>
    </section>
  );
}
