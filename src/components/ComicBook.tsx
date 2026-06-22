"use client";

import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { StylePackPicker } from "@/components/StylePackPicker";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  TattooRenderModeToggle,
  tattooRenderModeToIsolate,
  type TattooRenderMode,
} from "@/components/TattooRenderModeToggle";
import {
  ALLOWED_PAGE_COUNTS,
  DEFAULT_PAGES,
  type Comic,
  type ComicStyle,
} from "@/lib/comic-config";
import { formatGenerateLabel } from "@/lib/format-tokens";
import { startAndPollMotionVideo } from "@/lib/motion-client";
import {
  getComicPageCost,
  TOKEN_ACTIONS,
  getTokenCost,
} from "@/lib/token-costs";
import type { GenerateErrorResponse } from "@/lib/types";

const VIDEO_5S_COST = getTokenCost(TOKEN_ACTIONS.video_5s);
const VIDEO_10S_COST = getTokenCost(TOKEN_ACTIONS.video_10s);
const STORAGE_KEY = "ink-n-motion:comic-result:v1";
const GENERIC_MOTION_PROMPT =
  "Bring this image to life with subtle natural motion, cinematic gentle movement, smooth animation";

type SceneVideoState = {
  status: "idle" | "loading" | "done" | "error";
  videoUrl?: string;
  error?: string;
};

interface StoredComicResult {
  comic: Comic;
  current: number;
  sceneVideos: SceneVideoState[];
}

function normalizeSceneVideosForStorage(
  sceneVideos: SceneVideoState[],
): SceneVideoState[] {
  return sceneVideos.map((entry) =>
    entry.status === "loading" ? { status: "idle" as const } : entry,
  );
}

function isStoredComicResult(value: unknown): value is StoredComicResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const comic = record.comic;

  if (!comic || typeof comic !== "object") {
    return false;
  }

  const comicRecord = comic as Record<string, unknown>;
  if (typeof comicRecord.title !== "string" || !Array.isArray(comicRecord.pages)) {
    return false;
  }

  if (typeof record.current !== "number" || !Number.isInteger(record.current) || record.current < 0) {
    return false;
  }

  if (!Array.isArray(record.sceneVideos)) {
    return false;
  }

  return true;
}

export default function ComicBook() {
  const { user, tokens, authLoading, refreshBalance, isAuthEnabled } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [story, setStory] = useState("");
  const [style, setStyle] = useState<ComicStyle>("classic-comic");
  const [pages, setPages] = useState(DEFAULT_PAGES);
  const [renderMode, setRenderMode] = useState<TattooRenderMode>("on-skin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comic, setComic] = useState<Comic | null>(null);
  const [current, setCurrent] = useState(0);
  const [sceneVideos, setSceneVideos] = useState<SceneVideoState[]>([]);
  const motionPollAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      motionPollAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!isStoredComicResult(parsed)) {
        return;
      }

      const pageCount = parsed.comic.pages.length;
      const restoredCurrent = Math.min(parsed.current, Math.max(pageCount - 1, 0));
      const restoredSceneVideos = normalizeSceneVideosForStorage(
        parsed.sceneVideos.slice(0, pageCount),
      );

      while (restoredSceneVideos.length < pageCount) {
        restoredSceneVideos.push({ status: "idle" });
      }

      setComic(parsed.comic);
      setCurrent(restoredCurrent);
      setSceneVideos(restoredSceneVideos);
    } catch {
      // Ignore invalid or corrupted session data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || comic === null) {
      return;
    }

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          comic,
          current,
          sceneVideos: normalizeSceneVideosForStorage(sceneVideos),
        }),
      );
    } catch {
      // Ignore quota or serialization errors.
    }
  }, [comic, current, sceneVideos]);

  const isolate = tattooRenderModeToIsolate(renderMode);
  const tokenCost = useMemo(
    () => getComicPageCost(isolate) * pages,
    [isolate, pages],
  );
  const hasEnoughTokens = (tokens ?? 0) >= tokenCost;
  const isLoggedIn = Boolean(user);
  const currentSceneVideo = sceneVideos[current];
  const isFinalScene = comic ? current === comic.pages.length - 1 : false;
  const showEndingTeaser =
    Boolean(comic) &&
    isFinalScene &&
    currentSceneVideo?.status !== "done" &&
    currentSceneVideo?.status !== "loading";

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

    if (!user) {
      setError("Log in to create — sign up free and get 3 tokens.");
      return;
    }

    if ((tokens ?? 0) < tokenCost) {
      setError(
        `Not enough tokens. You need ${tokenCost} token${tokenCost === 1 ? "" : "s"} for this story.`,
      );
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
        body: JSON.stringify({
          imageUrl: url,
          story,
          style,
          pages,
          isolate,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as GenerateErrorResponse & {
        comic?: Comic;
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

      if (!res.ok || !data.comic) {
        const refundNote = data.refunded ? " Your tokens were refunded." : "";
        setError((data.error || "Generation failed") + refundNote);
        await refreshBalance();
        return;
      }

      setComic(data.comic);
      setCurrent(0);
      setSceneVideos(
        data.comic.pages.map(() => ({ status: "idle" as const })),
      );
      await refreshBalance();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      await refreshBalance();
    } finally {
      setLoading(false);
    }
  }

  async function animateScene(sceneIndex: number, durationSeconds: 5 | 10) {
    if (!comic || !user) {
      return;
    }

    const tokenCostForClip =
      durationSeconds === 5 ? VIDEO_5S_COST : VIDEO_10S_COST;

    if ((tokens ?? 0) < tokenCostForClip) {
      setError(
        `Not enough tokens. You need ${tokenCostForClip} token${tokenCostForClip === 1 ? "" : "s"} for this clip.`,
      );
      return;
    }

    setError("");
    setSceneVideos((prev) => {
      const next = [...prev];
      next[sceneIndex] = { status: "loading" };
      return next;
    });

    try {
      const caption = comic.pages[sceneIndex].caption?.trim();
      const motionPrompt = caption
        ? `Animate this scene: ${caption}`
        : GENERIC_MOTION_PROMPT;

      motionPollAbortRef.current?.abort();
      const controller = new AbortController();
      motionPollAbortRef.current = controller;

      const result = await startAndPollMotionVideo({
        imageUrl: comic.pages[sceneIndex].image,
        durationSeconds,
        prompt: motionPrompt,
        signal: controller.signal,
      });

      if (!result.ok) {
        setSceneVideos((prev) => {
          const next = [...prev];
          next[sceneIndex] = {
            status: "error",
            error: result.error,
          };
          return next;
        });
        await refreshBalance();
        return;
      }

      setSceneVideos((prev) => {
        const next = [...prev];
        next[sceneIndex] = { status: "done", videoUrl: result.videoUrl };
        return next;
      });
      await refreshBalance();
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      setSceneVideos((prev) => {
        const next = [...prev];
        next[sceneIndex] = {
          status: "error",
          error: e instanceof Error ? e.message : "Animation failed",
        };
        return next;
      });
      await refreshBalance();
    }
  }

  function buttonLabel(): string {
    if (loading) {
      return "Illustrating your story…";
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
    return formatGenerateLabel(tokenCost, "Generate story");
  }

  const canGenerate =
    Boolean(file && story.trim()) &&
    isLoggedIn &&
    hasEnoughTokens &&
    !loading;

  return (
    <div id="movie-mode" className="w-full">
      {!comic && (
        <div className="glass-panel space-y-5 rounded-3xl p-6 sm:p-8">
          <label
            htmlFor="movie-mode-upload"
            className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface/60 transition-colors hover:border-accent/50"
          >
            <input
              id="movie-mode-upload"
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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <StylePackPicker
                id="movie-mode-style"
                value={style}
                onChange={setStyle}
              />
            </div>

            <div className="flex flex-col gap-2 sm:w-44">
              <span className="text-sm font-medium text-white">Scenes</span>
              <div className="flex rounded-xl border border-border bg-surface p-1">
                {ALLOWED_PAGE_COUNTS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPages(count)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                      pages === count
                        ? "bg-accent text-white shadow-sm"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    {count} scenes
                  </button>
                ))}
              </div>
            </div>
          </div>

          <TattooRenderModeToggle
            value={renderMode}
            onChange={setRenderMode}
            id="movie-mode-render-mode"
          />

          {!authLoading && !isLoggedIn && file && story.trim() && (
            <p className="text-center text-xs text-muted">
              <Link href="/login" className="text-accent hover:underline">
                Log in
              </Link>{" "}
              to generate ({tokenCost} token{tokenCost === 1 ? "" : "s"}
              {isolate ? ", isolate mode" : ""}).
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

          <button
            type="button"
            onClick={() => void generate()}
            disabled={!canGenerate && !(file && story.trim() && !isLoggedIn)}
            className="btn-primary w-full rounded-full py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {buttonLabel()}
          </button>
        </div>
      )}

      {comic && (
        <div className="mt-8">
          <h3 className="text-center text-2xl font-bold tracking-tight">
            {comic.title}
          </h3>

          <div className="glass-panel mt-4 overflow-hidden rounded-3xl">
            {currentSceneVideo?.status === "done" && currentSceneVideo.videoUrl ? (
              <video
                src={currentSceneVideo.videoUrl}
                controls
                playsInline
                className="w-full object-contain"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={comic.pages[current].image}
                alt={`Scene ${current + 1}`}
                className="w-full object-contain"
              />
            )}
            {currentSceneVideo?.status === "loading" && (
              <p className="border-t border-border px-4 py-2 text-center text-xs text-muted">
                Animating scene {current + 1}… (this can take a few minutes)
              </p>
            )}
            {currentSceneVideo?.status === "error" && currentSceneVideo.error && (
              <p className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-xs text-red-100">
                {currentSceneVideo.error}
              </p>
            )}
            <p className="border-t border-border p-4 text-center text-sm text-muted sm:text-base">
              {comic.pages[current].caption}
            </p>
          </div>

          {showEndingTeaser && (
            <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-5 text-center">
              <h4 className="text-base font-semibold text-white">
                Want to see the ending come alive?
              </h4>
              <p className="mt-1 text-xs text-muted">
                Animate the final scene into a short video clip.
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => void animateScene(current, 10)}
                  disabled={(tokens ?? 0) < VIDEO_10S_COST}
                  className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Bring the ending to life · 10s · {VIDEO_10S_COST} tokens
                </button>
                <button
                  type="button"
                  onClick={() => void animateScene(current, 5)}
                  disabled={(tokens ?? 0) < VIDEO_5S_COST}
                  className="text-xs text-muted transition-colors hover:text-white disabled:opacity-50"
                >
                  or 5s · {VIDEO_5S_COST} tokens
                </button>
              </div>
              {(tokens ?? 0) < VIDEO_10S_COST && (
                <p className="mt-3 text-xs text-muted">
                  Not enough tokens.{" "}
                  <Link href="/pricing" className="text-accent hover:underline">
                    Buy tokens
                  </Link>
                </p>
              )}
            </div>
          )}

          {!isFinalScene &&
            comic &&
            currentSceneVideo?.status !== "done" &&
            currentSceneVideo?.status !== "loading" && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => void animateScene(current, 5)}
                  disabled={(tokens ?? 0) < VIDEO_5S_COST}
                  className="text-xs text-muted transition-colors hover:text-white disabled:opacity-50"
                >
                  Animate this scene · 5s · {VIDEO_5S_COST} tokens
                </button>
              </div>
            )}

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
              Scene {current + 1} / {comic.pages.length}
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
            {currentSceneVideo?.status === "done" && currentSceneVideo.videoUrl ? (
              <>
                <a
                  href={currentSceneVideo.videoUrl}
                  download
                  className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white"
                >
                  Download clip
                </a>
                <ShareButton
                  url={currentSceneVideo.videoUrl}
                  title="My tattoo scene from Ink-N-Motion"
                />
              </>
            ) : (
              <>
                <a
                  href={comic.pages[current].image}
                  download
                  className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white"
                >
                  Download scene
                </a>
                <ShareButton
                  url={comic.pages[current].image}
                  title="My tattoo scene from Ink-N-Motion"
                />
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setComic(null);
                setCurrent(0);
                setSceneVideos([]);
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem(STORAGE_KEY);
                }
              }}
              className="btn-secondary rounded-full px-5 py-2 text-sm"
            >
              New story
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
