import {
  TOKEN_ACTIONS,
  getTokenCost,
  type TokenAction,
} from "@/lib/token-costs";

export function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveVideoAction(durationSeconds: number): TokenAction | null {
  if (durationSeconds === 5) {
    return TOKEN_ACTIONS.video_5s;
  }
  if (durationSeconds === 10) {
    return TOKEN_ACTIONS.video_10s;
  }
  return null;
}

export function getVideoTokenCost(durationSeconds: number): number | null {
  const action = resolveVideoAction(durationSeconds);
  return action ? getTokenCost(action) : null;
}
