"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  TattooRenderModeToggle,
  tattooRenderModeToIsolate,
  type TattooRenderMode,
} from "@/components/TattooRenderModeToggle";
import {
  ALLOWED_PAGE_COUNTS,
  COMIC_STYLES,
  DEFAULT_PAGES,
  type Comic,
  type ComicStyle,
} from "@/lib/comic-config";
import { formatGenerateLabel } from "@/lib/format-tokens";
import {
  getComicPageCost,
  TOKEN_ACTIONS,
  getTokenCost,
} from "@/lib/token-costs";
import type { GenerateErrorResponse } from "@/lib/types";

const VIDEO_5S_COST = getTokenCost(TOKEN_ACTIONS.video_5s);

type SceneVideoState = {
  status: "idle" | "loading" | "done" | "error";
  videoUrl?: string;
  error?: string;
};

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
  const [animatingScenes, setAnimatingScenes] = useState(false);
  const [animatePromptDismissed, setAnimatePromptDismissed] = useState(false);

  const isolate = tattooRenderModeToIsolate(renderMode);
  const tokenCost = useMemo(
    () => getComicPageCost(isolate) * pages,
    [isolate, pages],
  );
  const hasEnoughTokens = (tokens ?? 0) >= tokenCost;
  const isLoggedIn = Boolean(user);
  const animateTotalCost = comic ? comic.pages.length * VIDEO_5S_COST : 0;
  const hasEnoughForAnimate = (tokens ?? 0) >= animateTotalCost;
  const currentSceneVideo = sceneVideos[current];
  const showAnimatePrompt =
    Boolean(comic) &&
    !animatePromptDismissed &&
    !animatingScenes &&
    sceneVideos.every((scene) => scene.status === "idle");

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
      setAnimatePromptDismissed(false);
      await refreshBalance();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      await refreshBalance();
    } finally {
      setLoading(false);
    }
  }

  async function bringScenesToLife() {
    if (!comic || !user) {
      return;
    }

    if ((tokens ?? 0) < animateTotalCost) {
      setError(
        `Not enough tokens. You need ${animateTotalCost} tokens to animate all ${comic.pages.length} scenes.`,
      );
      return;
    }

    setError("");
    setAnimatingScenes(true);
    setAnimatePromptDismissed(true);
    setSceneVideos(comic.pages.map(() => ({ status: "loading" as const })));

    const tasks = comic.pages.map((page, index) =>
      (async () => {
        try {
          const res = await fetch("/api/motion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: page.image,
              durationSeconds: 5,
            }),
          });

          const data = (await res.json().catch(() => ({}))) as GenerateErrorResponse & {
            videoUrl?: string;
          };

          if (!res.ok || !data.videoUrl) {
            const refundNote = data.refunded ? " Tokens refunded." : "";
            setSceneVideos((prev) => {
              const next = [...prev];
              next[index] = {
                status: "error",
                error: (data.error || "Animation failed") + refundNote,
              };
              return next;
            });
            return;
          }

          setSceneVideos((prev) => {
            const next = [...prev];
            next[index] = { status: "done", videoUrl: data.videoUrl };
            return next;
          });
        } catch (e: unknown) {
          setSceneVideos((prev) => {
            const next = [...prev];
            next[index] = {
              status: "error",
              error: e instanceof Error ? e.message : "Animation failed",
            };
            return next;
          });
        }
      })(),
    );

    await Promise.allSettled(tasks);
    await refreshBalance();
    setAnimatingScenes(false);
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
                Animating scene {current + 1}… (can take 1–3 minutes)
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

          {showAnimatePrompt && (
            <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center">
              <p className="text-sm text-white">
                Bring these scenes to life? — animate each scene into a 5s clip (
                {VIDEO_5S_COST} tokens each)
              </p>
              <p className="mt-1 text-xs text-muted">
                Total: {animateTotalCost} tokens · can take several minutes
              </p>
              {!hasEnoughForAnimate && (
                <p className="mt-2 text-xs text-muted">
                  Not enough tokens.{" "}
                  <Link href="/pricing" className="text-accent hover:underline">
                    Buy tokens
                  </Link>
                </p>
              )}
              <button
                type="button"
                onClick={() => void bringScenesToLife()}
                disabled={!hasEnoughForAnimate || animatingScenes}
                className="btn-primary mt-3 rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {formatGenerateLabel(animateTotalCost, "Animate all scenes")}
              </button>
            </div>
          )}

          {animatingScenes && (
            <div className="mt-4 rounded-xl border border-border bg-surface/60 px-4 py-3 text-center text-sm text-muted">
              Animating scenes in parallel…{" "}
              {sceneVideos.filter((s) => s.status === "done").length} /{" "}
              {comic.pages.length} complete
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
              <a
                href={currentSceneVideo.videoUrl}
                download
                className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white"
              >
                Download clip
              </a>
            ) : (
              <a
                href={comic.pages[current].image}
                download
                className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white"
              >
                Download scene
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                setComic(null);
                setCurrent(0);
                setSceneVideos([]);
                setAnimatePromptDismissed(false);
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
