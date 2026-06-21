export type StylePack = "classic-comic" | "manga" | "noir";

export interface StylePackOption {
  id: StylePack;
  label: string;
  description: string;
  prompt: string;
}

export interface GenerateRequest {
  imageUrl: string;
  stylePack: StylePack;
  isolate?: boolean;
}

export interface GenerateResponse {
  outputUrl: string;
  tokensRemaining: number;
}

export interface GenerateErrorResponse {
  error: string;
  stage?: string;
  code?: string;
  cost?: number;
  balance?: number;
  tokensRemaining?: number;
  refunded?: boolean;
}

export interface ComicResponse {
  comic: {
    title: string;
    pages: Array<{ caption: string; image: string }>;
  };
  tokensRemaining: number;
}

export interface UploadResponse {
  url: string;
}

export interface UploadErrorResponse {
  error: string;
}

export interface CheckoutResponse {
  url: string;
  mock?: boolean;
}
