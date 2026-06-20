export function buildComicScript(
  story: string,
  pageCount: number,
): { title: string; captions: string[] } {
  const trimmed = story.trim();
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks =
    sentences.length >= pageCount
      ? distributeItems(sentences, pageCount)
      : distributeItems(splitFallback(trimmed, pageCount), pageCount);

  const titleSource = sentences[0] ?? trimmed;
  const title =
    titleSource.length > 64
      ? `${titleSource.slice(0, 61).trim()}…`
      : titleSource;

  const captions = chunks.map((chunk, index) => {
    const text = chunk.join(" ").trim();
    if (text) {
      return text.endsWith(".") || text.endsWith("!") || text.endsWith("?")
        ? text
        : `${text}.`;
    }
    return `Page ${index + 1} of the story continues…`;
  });

  return { title, captions };
}

function splitFallback(story: string, pageCount: number): string[] {
  const words = story.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return Array.from({ length: pageCount }, () => story);
  }
  return distributeItems(words, pageCount).map((group) => group.join(" "));
}

function distributeItems<T>(items: T[], buckets: number): T[][] {
  const result: T[][] = Array.from({ length: buckets }, () => []);
  items.forEach((item, index) => {
    result[index % buckets].push(item);
  });
  return result.filter((bucket) => bucket.length > 0);
}
