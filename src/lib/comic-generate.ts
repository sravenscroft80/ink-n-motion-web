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
  const images: string[] = [];

  for (const [index, caption] of captions.entries()) {
    const scenePrompt = isolate
      ? `story panel ${index + 1}: ${caption}, tattoo design only on white background`
      : `page ${index + 1} of ${pageCount}, narrative scene: ${caption}`;

    const image = await generateComicRender(imageUrl, style as StylePack, {
      scenePrompt,
      isolate,
    });
    images.push(image);
  }

  const pages = captions.map((caption, index) => ({
    caption,
    image: images[index],
  }));

  return { title, pages };
}
