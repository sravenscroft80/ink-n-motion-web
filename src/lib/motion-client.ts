import type { GenerateErrorResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 160;

export interface MotionStartSuccess {
  predictionId: string;
  spendBatchId: string;
  durationSeconds: 5 | 10;
  tokensRemaining?: number;
}

export type MotionPollSuccess = {
  ok: true;
  videoUrl: string;
  tokensRemaining?: number;
};

export type MotionPollFailure = {
  ok: false;
  error: string;
  tokensRemaining?: number;
};

export type MotionPollResult = MotionPollSuccess | MotionPollFailure;

interface MotionStatusResponse {
  status: "processing" | "succeeded" | "failed";
  videoUrl?: string;
  error?: string;
}

async function requestMotionRefund(
  spendBatchId: string,
  durationSeconds: 5 | 10,
): Promise<number | undefined> {
  const res = await fetch("/api/motion/refund", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spendBatchId, durationSeconds }),
  });

  const data = (await res.json().catch(() => ({}))) as GenerateErrorResponse;
  return data.tokensRemaining;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function startAndPollMotionVideo(options: {
  imageUrl: string;
  durationSeconds: 5 | 10;
  prompt?: string;
  signal?: AbortSignal;
}): Promise<MotionPollResult> {
  const { imageUrl, durationSeconds, prompt, signal } = options;

  const startRes = await fetch("/api/motion/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, durationSeconds, prompt }),
    signal,
  });

  const startData = (await startRes.json().catch(() => ({}))) as GenerateErrorResponse &
    Partial<MotionStartSuccess>;

  if (startRes.status === 401) {
    return { ok: false, error: startData.error || "Log in to create." };
  }

  if (startRes.status === 402) {
    return {
      ok: false,
      error: startData.error || "Not enough tokens.",
      tokensRemaining: startData.tokensRemaining,
    };
  }

  if (
    !startRes.ok ||
    !startData.predictionId ||
    !startData.spendBatchId
  ) {
    const refundNote = startData.refunded ? " Your tokens were refunded." : "";
    return {
      ok: false,
      error: (startData.error || "Failed to start video generation") + refundNote,
      tokensRemaining: startData.tokensRemaining,
    };
  }

  const { predictionId, spendBatchId } = startData;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    if (signal?.aborted) {
      const tokensRemaining = await requestMotionRefund(
        spendBatchId,
        durationSeconds,
      );
      return {
        ok: false,
        error: "Video generation canceled.",
        tokensRemaining,
      };
    }

    await wait(POLL_INTERVAL_MS, signal);

    const statusRes = await fetch(
      `/api/motion/status?id=${encodeURIComponent(predictionId)}`,
      { signal },
    );

    const statusData = (await statusRes.json().catch(() => ({}))) as MotionStatusResponse &
      GenerateErrorResponse;

    if (!statusRes.ok) {
      const tokensRemaining = await requestMotionRefund(
        spendBatchId,
        durationSeconds,
      );
      return {
        ok: false,
        error: statusData.error || "Failed to check video status.",
        tokensRemaining,
      };
    }

    if (statusData.status === "succeeded" && statusData.videoUrl) {
      return { ok: true, videoUrl: statusData.videoUrl };
    }

    if (statusData.status === "failed") {
      const tokensRemaining = await requestMotionRefund(
        spendBatchId,
        durationSeconds,
      );
      return {
        ok: false,
        error: statusData.error || "Video generation failed.",
        tokensRemaining,
      };
    }
  }

  const tokensRemaining = await requestMotionRefund(spendBatchId, durationSeconds);
  return {
    ok: false,
    error: "Video generation timed out. Your tokens were refunded.",
    tokensRemaining,
  };
}
