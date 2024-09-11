import { sleep } from ".";
import { TTSResponse } from "../step-02-text-to-speech";
import { step04TextToImage } from "../step-04-text-to-image";
import { step05ImageToVideo } from "../step-05-image-to-video";
import { apiFromCacheOr } from "./api-cache";
import { promises as fs } from "fs";
export type ImageSpeechAlignment = {
  startSeconds: number;
  endSeconds: number;
  prompt: string;
  speech: string;
};
export type ImageSpeechVideoAlignment = ImageSpeechAlignment & {
  video: string;
};

export function alignSpeech(
  monologue: string,
  speech: TTSResponse,
  prompts: { text: string; prompt: string }[]
) {
  const output: ImageSpeechAlignment[] = [];
  const alignment = { ...speech.alignment };
  for (const prompt of prompts) {
    const leadingWS = monologue.match(/^\s+/);
    if (leadingWS && prompt.text[0] !== monologue[0]) {
      prompt.text = leadingWS[0] + prompt.text;
    }
    if (!monologue.startsWith(prompt.text))
      throw Error(
        `monologue does not start with prompt: ${
          prompt.text
        }>>>${monologue.slice(0, prompt.text.length)}`
      );
    const speechText = alignment.characters
      .slice(0, prompt.text.length)
      .join("");
    if (speechText.trim() !== prompt.text.trim())
      throw Error(
        `speech does not match prompt: '${prompt.text}'>>>'${speechText}'`
      );
    output.push({
      startSeconds: alignment.character_start_times_seconds[0],
      endSeconds: alignment.character_end_times_seconds[prompt.text.length - 1],
      prompt: prompt.prompt,
      speech: prompt.text,
    });

    monologue = monologue.slice(prompt.text.length);
    alignment.characters = alignment.characters.slice(prompt.text.length);
    alignment.character_start_times_seconds =
      alignment.character_start_times_seconds.slice(prompt.text.length);
    alignment.character_end_times_seconds =
      alignment.character_end_times_seconds.slice(prompt.text.length);
  }
  return output;
}

export async function alignVideo(
  alignment: ImageSpeechAlignment[],
  config: any,
  projectDir: string
): Promise<(ImageSpeechVideoAlignment | null)[]> {
  let sleepDur = 0;
  const preSleep = () => sleep(sleepDur++ * 10000);
  return await Promise.all(
    alignment.map(async (prompt) => {
      const img1 = await step04TextToImage(
        apiFromCacheOr,
        config,
        prompt.prompt
      );
      let res;
      try {
        res = await step05ImageToVideo(
          apiFromCacheOr,
          config,
          prompt.prompt,
          img1.imageFilePath,
          preSleep
        );
      } catch (e) {
        console.error(e);
        return null;
      }
      await fs.copyFile(
        res.videoFilePath,
        projectDir +
          `${prompt.startSeconds.toFixed(2)}-${prompt.endSeconds.toFixed(
            3
          )}-vid.mp4`
      );
      return {
        ...prompt,
        video: res.videoFilePath,
      };
    })
  );
}
