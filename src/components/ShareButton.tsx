"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  title?: string;
  filename?: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — no-op
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="btn-secondary rounded-full px-5 py-2 text-sm"
    >
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
