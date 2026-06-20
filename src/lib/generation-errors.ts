export type GenerationStage =
  | "extract"
  | "replicate_create"
  | "replicate_poll"
  | "replicate_output"
  | "stylize"
  | "unknown";

export class GenerationError extends Error {
  readonly stage: GenerationStage;
  readonly cause?: unknown;

  constructor(message: string, stage: GenerationStage, cause?: unknown) {
    super(message);
    this.name = "GenerationError";
    this.stage = stage;
    this.cause = cause;
  }
}

export function getGenerationErrorResponse(error: unknown): {
  message: string;
  stage: GenerationStage;
  status: number;
} {
  if (error instanceof GenerationError) {
    return {
      message: error.message,
      stage: error.stage,
      status: error.message.includes("timed out") ? 504 : 500,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stage: "unknown",
      status: error.message.includes("timed out") ? 504 : 500,
    };
  }

  return {
    message: "Generation failed. Please try again.",
    stage: "unknown",
    status: 500,
  };
}

export function logGenerationFailure(
  context: string,
  error: unknown,
): void {
  if (error instanceof GenerationError) {
    console.error(`[${context}] generation failed`, {
      stage: error.stage,
      message: error.message,
      cause: error.cause,
    });
    return;
  }

  console.error(`[${context}] generation failed`, {
    stage: "unknown",
    error,
  });
}
