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
  prompts: { text: string; prompt: string }[],
  secondsAfter: number
) {
  const output: ImageSpeechAlignment[] = [];
  const alignment = { ...speech.alignment };
  // ugly hack
  if (prompts[0].text.startsWith('"') && !monologue.startsWith('"')) {
    prompts[0].text = prompts[0].text.slice(1);
    prompts[prompts.length - 1].text = prompts[prompts.length - 1].text.slice(
      0,
      -1
    );
  }
  for (const prompt of prompts) {
    const leadingWS = monologue.match(/^[\s]+/);
    if (leadingWS && prompt.text[0] !== monologue[0]) {
      prompt.text = leadingWS[0] + prompt.text;
    }
    if (!monologue.startsWith(prompt.text))
      throw Error(
        `monologue does not start with prompt: '${
          prompt.text
        }'>>>'${monologue.slice(0, prompt.text.length)}'`
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
  output[output.length - 1].endSeconds += secondsAfter;
  return output;
}

export async function alignVideo(
  alignment: ImageSpeechAlignment[],
  config: any,
  projectDir: string
): Promise<PromiseSettledResult<ImageSpeechVideoAlignment>[]> {
  let sleepDur = 0;
  const preSleep = () => sleep(sleepDur++ * 10000);
  return await Promise.allSettled(
    alignment.map(async (prompt) => {
      const res = await generateWithRetry(prompt, config, preSleep, projectDir);
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

async function generateWithRetry(
  prompt: ImageSpeechAlignment,
  config: any,
  preSleep: () => Promise<void>,
  projectDir: string
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const img1 = await step04TextToImage(
      apiFromCacheOr,
      config,
      prompt.prompt + (attempt ? ` (${attempt})` : "")
    );
    await fs.copyFile(
      img1.imageFilePath,
      projectDir +
        `${prompt.startSeconds.toFixed(2)}-${prompt.endSeconds.toFixed(3)}-img${
          attempt ? `attempt-${attempt}` : ""
        }.jpg`
    );
    try {
      const res = await step05ImageToVideo(
        apiFromCacheOr,
        config,
        prompt.prompt,
        img1.imageFilePath,
        attempt === 0 ? preSleep : async () => {}
      );
      if (res.data.result === "refused-content-error") {
        throw Error("refused: content error");
      }
      return res;
    } catch (e) {
      console.error("retrying attempt", attempt, e);
    }
  }
  throw Error("failed to generate video");
}
