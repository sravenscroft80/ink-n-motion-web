import type { Comic, ComicStyle } from "@/lib/comic-config";
import { buildComicScript } from "@/lib/comic-story";
import { generateComicRender } from "@/lib/replicate";
import type { StylePack } from "@/lib/types";

export async function generateComic(
  imageUrl: string,
  story: string,
  style: ComicStyle,
  pageCount: number,
  isolate: boolean,
): Promise<Comic> {
  const { title, captions } = buildComicScript(story, pageCount);

  const images = await Promise.all(
    captions.map((caption, index) => {
      const scenePrompt = isolate
        ? `story panel ${index + 1}: ${caption}, tattoo design only on white background`
        : `page ${index + 1} of ${pageCount}, narrative scene: ${caption}`;

      return generateComicRender(imageUrl, style as StylePack, {
        scenePrompt,
        isolate,
      });
    }),
  );

  const pages = captions.map((caption, index) => ({
    caption,
    image: images[index],
  }));

  return { title, pages };
}
