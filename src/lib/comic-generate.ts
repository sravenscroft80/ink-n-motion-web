import type { Comic, ComicStyle } from "@/lib/comic-config";
import { buildComicScript } from "@/lib/comic-story";
import { generateComicRender } from "@/lib/replicate";
import type { StylePack } from "@/lib/types";

export async function generateComic(
  imageUrl: string,
  story: string,
  style: ComicStyle,
  pageCount: number,
): Promise<Comic> {
  const { title, captions } = buildComicScript(story, pageCount);
  const pages: Comic["pages"] = [];

  for (let index = 0; index < captions.length; index += 1) {
    const caption = captions[index];
    const scenePrompt = `story panel ${index + 1}: ${caption}, tattoo design only on white background`;
    const image = await generateComicRender(
      imageUrl,
      style as StylePack,
      scenePrompt,
    );
    pages.push({ caption, image });
  }

  return { title, pages };
}
