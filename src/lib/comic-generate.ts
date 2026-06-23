import type { Comic, ComicStyle } from "@/lib/comic-config";
import { buildComicScript } from "@/lib/comic-story";
import { generateComicRender } from "@/lib/replicate";
import { planComicScript } from "@/lib/story-director";
import type { StylePack } from "@/lib/types";

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

  let prompt: string;
  if (!isFinal) {
    prompt =
      `story beat ${beat} of ${pageCount}: ${caption}, a fully illustrated story scene depicting this moment, dynamic environment and background, cinematic composition` +
      ", depict the story moment as a complete illustrated scene, do not just show the tattoo on skin, do not jump ahead to the ending or final tattoo form";
  } else {
    prompt = `story beat ${beat} of ${pageCount}: ${caption}, comic book panel illustration`;
    prompt +=
      ", this is the finale — render the actual tattoo from the reference photo as the story's payoff, faithfully preserving the real tattoo's subject and composition, enhanced and integrated into the scene in the chosen art style";
  }
  return withSubject(prompt, subject);
}

function resolveImageInfluence(index: number, pageCount: number): number {
  const isFinal = index === pageCount - 1;

  if (isFinal) {
    return 0.85;
  }

  return 0.12;
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

  for (const [index, caption] of captions.entries()) {
    const scenePrompt = buildScenePrompt(
      caption,
      index,
      pageCount,
      isolate,
      subject,
    );

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
