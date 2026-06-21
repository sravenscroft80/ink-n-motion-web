"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LoadingState } from "@/components/LoadingState";
import { ResultView } from "@/components/ResultView";
import { SeeItStrip } from "@/components/SeeItStrip";
import { UploadSection } from "@/components/UploadSection";
import ComicBook from "@/components/ComicBook";
import {
  tattooRenderModeToIsolate,
  type TattooRenderMode,
} from "@/components/TattooRenderModeToggle";
import { getStylePack } from "@/lib/style-packs";
import { getStyleStillCost } from "@/lib/token-costs";
import type { GenerateErrorResponse, GenerateResponse, StylePack } from "@/lib/types";

type AppState = "idle" | "generating" | "result" | "error";

interface HomePageProps {
  initialToast?: string | null;
  refreshTokensOnMount?: boolean;
}

export function HomePage({
  initialToast = null,
  refreshTokensOnMount = false,
}: HomePageProps) {
  const { user, tokens, authLoading, refreshBalance, isAuthEnabled } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState<StylePack>("classic-comic");
  const [renderMode, setRenderMode] = useState<TattooRenderMode>("on-skin");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(initialToast);

  const tokenCost = getStyleStillCost();

  const styleLabel = useMemo(
    () => getStylePack(selectedStyle)?.label ?? "Classic Comic",
    [selectedStyle],
  );

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

  const handleFileSelect = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setResultUrl(null);
    setAppState("idle");
    setErrorMessage(null);
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      return;
    }

    if (!user) {
      setErrorMessage("Log in to create — sign up free and get 3 tokens.");
      setAppState("error");
      return;
    }

    if ((tokens ?? 0) < tokenCost) {
      setErrorMessage(
        `Not enough tokens. You need ${tokenCost} token${tokenCost === 1 ? "" : "s"} for this action.`,
      );
      setAppState("error");
      return;
    }

    setAppState("generating");
    setErrorMessage(null);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", selectedFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = (await uploadResponse.json()) as
        | { url: string }
        | { error: string };

      if (!uploadResponse.ok || !("url" in uploadData)) {
        const message =
          "error" in uploadData
            ? uploadData.error
            : "Upload failed. Please try again.";
        setErrorMessage(message);
        setAppState("error");
        return;
      }

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          stylePack: selectedStyle,
          isolate: tattooRenderModeToIsolate(renderMode),
        }),
      });

      const generateData = (await generateResponse.json()) as GenerateResponse &
        GenerateErrorResponse;

      if (generateResponse.status === 401) {
        setErrorMessage(generateData.error || "Log in to create.");
        setAppState("error");
        return;
      }

      if (generateResponse.status === 402) {
        setErrorMessage(generateData.error || "Not enough tokens.");
        setAppState("error");
        await refreshBalance();
        return;
      }

      if (!generateResponse.ok || !("outputUrl" in generateData)) {
        const message =
          "error" in generateData
            ? generateData.error
            : "Generation failed. Please try again.";
        const refundNote =
          "refunded" in generateData && generateData.refunded
            ? " Your tokens were refunded."
            : "";
        setErrorMessage(`${message}${refundNote}`);
        setAppState("error");
        await refreshBalance();
        return;
      }

      setResultUrl(generateData.outputUrl);
      setAppState("result");
      await refreshBalance();
    } catch {
      setErrorMessage("Network error. Check your connection and try again.");
      setAppState("error");
      await refreshBalance();
    }
  };

  const handleReset = () => {
    setResultUrl(null);
    setAppState("idle");
    setErrorMessage(null);
    document.getElementById("create")?.scrollIntoView({ behavior: "smooth" });
  };

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
        <ComicBook />
        <SeeItStrip />

        <UploadSection
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
          renderMode={renderMode}
          onRenderModeChange={setRenderMode}
          previewUrl={previewUrl}
          onFileSelect={handleFileSelect}
          onGenerate={() => void handleGenerate()}
          isGenerating={appState === "generating"}
          isLoggedIn={Boolean(user)}
          authLoading={authLoading && isAuthEnabled}
          tokens={tokens}
          tokenCost={tokenCost}
        />

        {appState === "generating" && <LoadingState styleLabel={styleLabel} />}

        {appState === "result" && resultUrl && (
          <ResultView
            imageUrl={resultUrl}
            styleLabel={styleLabel}
            onReset={handleReset}
          />
        )}

        {appState === "error" && errorMessage && (
          <section className="px-4 pb-16 sm:px-6">
            <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
              <p>{errorMessage}</p>
              {errorMessage.includes("Log in") && (
                <Link
                  href="/login"
                  className="mt-2 inline-block font-medium text-white underline"
                >
                  Log in to create
                </Link>
              )}
              {errorMessage.includes("Not enough tokens") && (
                <Link
                  href="/pricing"
                  className="mt-2 inline-block font-medium text-white underline"
                >
                  Buy tokens
                </Link>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted sm:px-6">
        <p>Ink-N-Motion · Comic stills v1 · Built for Vercel</p>
      </footer>
    </>
  );
}
