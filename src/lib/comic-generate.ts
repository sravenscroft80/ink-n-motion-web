import type { Comic, ComicStyle } from "@/lib/comic-config";
import { buildComicScript } from "@/lib/comic-story";
import { generateComicRender } from "@/lib/replicate";
import { planComicScript } from "@/lib/story-director";
import type { StylePack } from "@/lib/types";

const CHARACTER_SHEET_INFLUENCE = 0.45;
const CHAINED_SCENE_INFLUENCE = 0.35;

function withSubject(base: string, subject: string): string {
  const trimmedSubject = subject.trim();
  if (!trimmedSubject) {
    return base;
  }

  return `consistent recurring subject across all panels: ${trimmedSubject}. ${base}`;
}

function buildScenePrompt(
  caption: string,
  index: number,
  pageCount: number,
  isolate: boolean,
  subject: string,
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
    return withSubject(prompt, subject);
  }

  const prompt =
    `story beat ${beat} of ${pageCount}: ${caption}, a fully illustrated story scene depicting this moment, dynamic environment and background, cinematic composition` +
    ", depict the story moment as a complete illustrated scene, do not just show the tattoo on skin, do not jump ahead to the ending or final tattoo form";

  return withSubject(prompt, subject);
}

export async function generateComic(
  imageUrl: string,
  story: string,
  style: ComicStyle,
  pageCount: number,
  isolate: boolean,
): Promise<Comic> {
  let title: string;
  let captions: string[];
  let subject = "";

  try {
    const plan = await planComicScript(story, pageCount);
    title = plan.title;
    captions = plan.captions;
    subject = plan.subject;
  } catch {
    const fallback = buildComicScript(story, pageCount);
    title = fallback.title;
    captions = fallback.captions;
    subject = "";
  }

  const images: string[] = [];
  let characterRef = imageUrl;

  for (const [index, caption] of captions.entries()) {
    const scenePrompt = buildScenePrompt(
      caption,
      index,
      pageCount,
      isolate,
      subject,
    );

    const referenceImage = index === 0 ? imageUrl : characterRef;
    const imageInfluence =
      index === 0 ? CHARACTER_SHEET_INFLUENCE : CHAINED_SCENE_INFLUENCE;

    const image = await generateComicRender(referenceImage, style as StylePack, {
      scenePrompt,
      isolate,
      imageInfluence,
    });

    if (index === 0) {
      characterRef = image;
    }

    images.push(image);
  }

  const pages = captions.map((caption, index) => ({
    caption,
    image: images[index],
  }));

  return { title, pages };
}
