"use client";

import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { StylePackPicker } from "@/components/StylePackPicker";
import { formatGenerateLabel } from "@/lib/format-tokens";
import { getStylePrompt } from "@/lib/style-packs";
import {
  TOKEN_ACTIONS,
  getTokenCost,
} from "@/lib/token-costs";
import type { GenerateErrorResponse, StylePack } from "@/lib/types";

const DURATION_OPTIONS = [
  { seconds: 5 as const, cost: getTokenCost(TOKEN_ACTIONS.video_5s) },
  { seconds: 10 as const, cost: getTokenCost(TOKEN_ACTIONS.video_10s) },
];

export function MotionStudio() {
  const { user, tokens, authLoading, refreshBalance, isAuthEnabled } =
    useAuth();
  const [selectedStyle, setSelectedStyle] = useState<StylePack>("classic-comic");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<5 | 10>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const tokenCost = useMemo(
    () =>
      durationSeconds === 5
        ? getTokenCost(TOKEN_ACTIONS.video_5s)
        : getTokenCost(TOKEN_ACTIONS.video_10s),
    [durationSeconds],
  );
  const hasEnoughTokens = (tokens ?? 0) >= tokenCost;
  const isLoggedIn = Boolean(user);

  function handleFileSelect(nextFile: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
    setVideoUrl(null);
    setError("");
  }

  async function generate() {
    if (!file) {
      setError("Upload an image to animate.");
      return;
    }

    if (!user) {
      setError("Log in to create — sign up free and get 3 tokens.");
      return;
    }

    if ((tokens ?? 0) < tokenCost) {
      setError(
        `Not enough tokens. You need ${tokenCost} token${tokenCost === 1 ? "" : "s"} for this video.`,
      );
      return;
    }

    setError("");
    setLoading(true);
    setVideoUrl(null);

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

      const motionPrompt = getStylePrompt(selectedStyle);

      const res = await fetch("/api/motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: url,
          durationSeconds,
          prompt: motionPrompt,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as GenerateErrorResponse & {
        videoUrl?: string;
      };

      if (res.status === 401) {
        setError(data.error || "Log in to create.");
        return;
      }

      if (res.status === 402) {
        setError(data.error || "Not enough tokens.");
        await refreshBalance();
        return;
      }

      if (!res.ok || !data.videoUrl) {
        const refundNote = data.refunded ? " Your tokens were refunded." : "";
        setError((data.error || "Generation failed") + refundNote);
        await refreshBalance();
        return;
      }

      setVideoUrl(data.videoUrl);
      await refreshBalance();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      await refreshBalance();
    } finally {
      setLoading(false);
    }
  }

  function buttonLabel(): string {
    if (loading) {
      return "Generating motion…";
    }
    if (authLoading && isAuthEnabled) {
      return "Loading account…";
    }
    if (!isLoggedIn) {
      return "Log in to create";
    }
    if (!hasEnoughTokens) {
      return "Not enough tokens";
    }
    return formatGenerateLabel(tokenCost, "Generate motion");
  }

  const canGenerate =
    Boolean(file) && isLoggedIn && hasEnoughTokens && !loading;

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

      <StylePackPicker
        id="motion-studio-style"
        value={selectedStyle}
        onChange={setSelectedStyle}
      />
      <p className="text-xs text-muted">
        Used as a motion prompt to guide the animation style.
      </p>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-white">Duration</span>
        <div className="flex rounded-xl border border-border bg-surface p-1">
          {DURATION_OPTIONS.map(({ seconds, cost }) => (
            <button
              key={seconds}
              type="button"
              onClick={() => setDurationSeconds(seconds)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                durationSeconds === seconds
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-white"
              }`}
            >
              {seconds}s · {cost} tokens
            </button>
          ))}
        </div>
      </div>

      {!authLoading && !isLoggedIn && file && (
        <p className="text-center text-xs text-muted">
          <Link href="/login" className="text-accent hover:underline">
            Log in
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

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          <p>{error}</p>
          {error.includes("Log in") && (
            <Link
              href="/login"
              className="mt-2 inline-block font-medium text-white underline"
            >
              Log in to create
            </Link>
          )}
          {error.includes("Not enough tokens") && (
            <Link
              href="/pricing"
              className="mt-2 inline-block font-medium text-white underline"
            >
              Buy tokens
            </Link>
          )}
        </div>
      )}

      {loading && (
        <p className="text-center text-xs text-muted">
          Video generation can take 1–3 minutes. Please keep this tab open.
        </p>
      )}

      <button
        type="button"
        onClick={() => void generate()}
        disabled={!canGenerate && !(file && !isLoggedIn)}
        className="btn-primary w-full rounded-full py-3.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {buttonLabel()}
      </button>

      {videoUrl && (
        <div className="space-y-3 overflow-hidden rounded-2xl border border-border bg-surface">
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full"
          />
          <div className="flex flex-wrap justify-center gap-3 pb-4">
            <a
              href={videoUrl}
              download
              className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white"
            >
              Download video
            </a>
            <ShareButton
              url={videoUrl}
              title="My tattoo video from Ink-N-Motion"
            />
          </div>
        </div>
      )}
    </div>
  );
}
