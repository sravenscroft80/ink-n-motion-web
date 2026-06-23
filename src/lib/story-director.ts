export interface ComicScriptPlan {
  title: string;
  subject: string;
  captions: string[];
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

function normalizeCaptions(captions: unknown, pageCount: number): string[] {
  if (!Array.isArray(captions)) {
    throw new Error("captions must be an array");
  }

  const strings = captions
    .filter((caption): caption is string => typeof caption === "string")
    .map((caption) => caption.trim())
    .filter(Boolean);

  if (strings.length === 0) {
    throw new Error("captions must contain at least one non-empty string");
  }

  const normalized = strings.slice(0, pageCount);
  const padSource = normalized[normalized.length - 1] ?? "The story continues…";

  while (normalized.length < pageCount) {
    normalized.push(padSource);
  }

  return normalized;
}

function parsePlanResponse(
  json: unknown,
  pageCount: number,
): ComicScriptPlan {
  if (!json || typeof json !== "object") {
    throw new Error("Invalid story director response");
  }

  const record = json as Record<string, unknown>;
  const title =
    typeof record.title === "string" ? record.title.trim() : "";
  const subject =
    typeof record.subject === "string" ? record.subject.trim() : "";

  if (!title) {
    throw new Error("title must be a non-empty string");
  }

  if (!subject) {
    throw new Error("subject must be a non-empty string");
  }

  const captions = normalizeCaptions(record.captions, pageCount);

  return {
    title: title.length > 64 ? `${title.slice(0, 61).trim()}…` : title,
    subject,
    captions,
  };
}

export async function planComicScript(
  story: string,
  pageCount: number,
): Promise<ComicScriptPlan> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const trimmedStory = story.trim();
  if (!trimmedStory) {
    throw new Error("A story is required");
  }

  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new Error("pageCount must be a positive integer");
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a comic story director. Read the user's tattoo story and plan a visual storyboard. " +
              "Return JSON only with exactly these fields: " +
              "title (short, at most 64 characters), " +
              "subject (one vivid sentence describing the single recurring main character or subject — appearance and identity — so it can be drawn consistently in every panel), " +
              "captions (array of EXACTLY the requested number of short scene descriptions forming a clear beginning→middle→end arc; each caption is one visual moment featuring the subject).",
          },
          {
            role: "user",
            content: JSON.stringify({
              story: trimmedStory,
              pageCount,
              instructions: `Return captions with length exactly ${pageCount}.`,
            }),
          },
        ],
        temperature: 0.7,
      }),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Story director request failed",
    );
  }

  let payload: OpenAIChatResponse;
  try {
    payload = (await response.json()) as OpenAIChatResponse;
  } catch {
    throw new Error("Story director returned invalid JSON");
  }

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Story director request failed with status ${response.status}`,
    );
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Story director returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Story director returned malformed JSON content");
  }

  return parsePlanResponse(parsed, pageCount);
}
