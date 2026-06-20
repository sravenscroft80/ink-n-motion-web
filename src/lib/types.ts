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
  creditsRemaining: number;
}

export interface GenerateErrorResponse {
  error: string;
  stage?: string;
}

export interface UploadResponse {
  url: string;
}

export interface UploadErrorResponse {
  error: string;
}

export interface CreditsResponse {
  credits: number;
}

export interface CheckoutResponse {
  url: string;
  mock?: boolean;
}
