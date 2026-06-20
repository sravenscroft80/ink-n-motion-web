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
    const scenePrompt = `page ${index + 1} of ${pageCount}, narrative scene: ${caption}`;
    const image = await generateComicRender(
      imageUrl,
      style as StylePack,
      scenePrompt,
    );
    pages.push({ caption, image });
  }

  return { title, pages };
}
