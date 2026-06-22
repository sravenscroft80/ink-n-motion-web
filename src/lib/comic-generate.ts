import type { Comic, ComicStyle } from "@/lib/comic-config";
import { buildComicScript } from "@/lib/comic-story";
import { generateComicRender } from "@/lib/replicate";
import type { StylePack } from "@/lib/types";

function buildScenePrompt(
  caption: string,
  index: number,
  pageCount: number,
  isolate: boolean,
): string {
  const beat = index + 1;
  const isFinal = index === pageCount - 1;

  if (isolate) {
    let prompt = `story beat ${beat} of ${pageCount}: ${caption}, tattoo design only on white background`;
    if (!isFinal) {
      prompt +=
        ", depict only this story moment as described, do not show the final tattoo form or story ending yet";
    } else {
      prompt +=
        ", this is the finale — the real tattoo design from the reference, faithfully preserved and cleaned up, enhanced as the story's payoff";
    }
    return prompt;
  }

  let prompt = `story beat ${beat} of ${pageCount}: ${caption}, comic book panel illustration`;
  if (!isFinal) {
    prompt +=
      ", focus on this scene's subject and action only, do not jump ahead to the story's ending or final tattoo form, interpret the caption not the reference photo's finished subject";
  } else {
    prompt +=
      ", this is the finale — render the actual tattoo from the reference photo as the story's payoff, faithfully preserving the real tattoo's subject and composition, enhanced and integrated into the scene in the chosen art style";
  }
  return prompt;
}

function resolveImageInfluence(index: number, pageCount: number): number {
  const isFinal = index === pageCount - 1;

  if (isFinal) {
    return 0.85;
  }

  return 0.25;
}

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
    const scenePrompt = buildScenePrompt(caption, index, pageCount, isolate);

    const image = await generateComicRender(imageUrl, style as StylePack, {
      scenePrompt,
      isolate,
      imageInfluence: resolveImageInfluence(index, pageCount),
    });
    images.push(image);
  }

  const pages = captions.map((caption, index) => ({
    caption,
    image: images[index],
  }));

  return { title, pages };
}
