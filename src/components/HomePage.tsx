"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { GenerateErrorResponse, GenerateResponse, StylePack } from "@/lib/types";

type AppState = "idle" | "generating" | "result" | "error";

interface HomePageProps {
  initialCredits: number;
  initialToast?: string | null;
}

export function HomePage({
  initialCredits,
  initialToast = null,
}: HomePageProps) {
  const [credits, setCredits] = useState(initialCredits);
  const [selectedStyle, setSelectedStyle] = useState<StylePack>("classic-comic");
  const [renderMode, setRenderMode] = useState<TattooRenderMode>("on-skin");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(initialToast);

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
    if (!selectedFile || credits <= 0) {
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

      const generateData = (await generateResponse.json()) as
        | GenerateResponse
        | GenerateErrorResponse;

      if (!generateResponse.ok || !("outputUrl" in generateData)) {
        const message =
          "error" in generateData
            ? generateData.error
            : "Generation failed. Please try again.";
        setErrorMessage(message);
        setAppState("error");
        const creditsResponse = await fetch("/api/credits");
        if (creditsResponse.ok) {
          const creditsData = (await creditsResponse.json()) as { credits: number };
          setCredits(creditsData.credits);
        }
        return;
      }

      setResultUrl(generateData.outputUrl);
      setCredits(generateData.creditsRemaining);
      setAppState("result");
    } catch {
      setErrorMessage("Network error. Check your connection and try again.");
      setAppState("error");
      const creditsResponse = await fetch("/api/credits");
      if (creditsResponse.ok) {
        const creditsData = (await creditsResponse.json()) as { credits: number };
        setCredits(creditsData.credits);
      }
    }
  };

  const handleBuyCredits = async () => {
    setIsCheckoutLoading(true);
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const data = (await response.json()) as { url?: string; mock?: boolean };

      if (!response.ok || !data.url) {
        setToast("Unable to start checkout. Please try again.");
        return;
      }

      if (data.mock) {
        setToast("Stripe not configured — running mock checkout.");
      }

      window.location.href = data.url;
    } catch {
      setToast("Unable to start checkout. Please try again.");
    } finally {
      setIsCheckoutLoading(false);
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
      <Header
        credits={credits}
        onBuyCredits={() => void handleBuyCredits()}
        isCheckoutLoading={isCheckoutLoading}
      />

      {toast && (
        <div className="fixed right-4 top-20 z-50 max-w-sm rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      <main className="flex-1">
        <Hero onGetStarted={scrollToCreate} />
        <ComicBook onCreditsChange={setCredits} />
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
          credits={credits}
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
              {errorMessage}
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
