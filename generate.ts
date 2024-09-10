import { step00FindTopic } from "./step-00-find-topic";
import { step01WriteScript as step01WriteMonologue } from "./step-01-write-monologue";
import { step02TextToSpeech, TTSResponse } from "./step-02-text-to-speech";
import { step03TextToImagePrompt } from "./step-03-text-to-image-prompt";
import { step04TextToImage } from "./step-04-text-to-image";
import { step05ImageToVideo } from "./step-05-image-to-video";
import { step06ffmpeg } from "./step-06-ffmpeg";
import { sleep } from "./util";
import { apiFromCacheOr } from "./util/api-cache";
import { zeroStatsCounter } from "./util/stats";
import "dotenv/config";
import { promises as fs } from "fs";

function assertNonNull<T>(x: (T | null)[], e: string): asserts x is T[] {
  if (x.some((e) => e === null)) throw Error(e);
}
async function main() {
  const statsCounter = zeroStatsCounter();
  const config = process.env as any;
  const seed = 1352242559; // (Math.random() * Number.MAX_SAFE_INTEGER) | 0;
  const topics = await step00FindTopic(
    apiFromCacheOr,
    config,
    statsCounter,
    seed
  );
  const topic = topics[0];
  console.log(topic);
  const projectDir = `data/${topic.clickbait_title}/`;
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(projectDir + "topic.json", JSON.stringify(topic, null, 2));
  await fs.writeFile(projectDir + "seed.json", JSON.stringify(seed, null, 2));

  const monologue = await step01WriteMonologue(
    apiFromCacheOr,
    config,
    statsCounter,
    topic
  );
  await fs.writeFile(projectDir + "monologue.txt", monologue);
  const speech = await step02TextToSpeech(
    apiFromCacheOr,
    config,
    statsCounter,
    monologue
  );
  const audio = speech.meta.cachePrefix + "-audio.mp3";
  await fs.copyFile(
    speech.meta.cachePrefix + "-audio.mp3",
    projectDir + "speech.mp3"
  );

  const iprompts = await step03TextToImagePrompt(
    apiFromCacheOr,
    config,
    statsCounter,
    monologue
  );
  const alignment = align(monologue, speech.data, iprompts);
  for (const prompt of alignment) {
    const img = await step04TextToImage(apiFromCacheOr, config, prompt.prompt);
    await fs.copyFile(
      img.meta.cachePrefix + "-img.jpg",
      projectDir +
        `${prompt.startSeconds.toFixed(2)}-${prompt.endSeconds.toFixed(
          3
        )}-img.jpg`
    );
  }
  let sleepDur = 0;
  const preSleep = () => sleep(sleepDur++ * 10000);
  const videoAlignments = await Promise.all(
    alignment.map(async (prompt) => {
      const img1 = await step04TextToImage(
        apiFromCacheOr,
        config,
        prompt.prompt
      );
      const imageFilePath = img1.meta.cachePrefix + "-img.jpg";
      let res;
      try {
        res = await step05ImageToVideo(
          apiFromCacheOr,
          config,
          prompt.prompt,
          imageFilePath,
          preSleep
        );
      } catch (e) {
        console.error(e);
        return null;
      }
      await fs.copyFile(
        res.meta.cachePrefix + "-vid.mp4",
        projectDir +
          `${prompt.startSeconds.toFixed(2)}-${prompt.endSeconds.toFixed(
            3
          )}-vid.mp4`
      );
      return {
        ...prompt,
        video: res.meta.cachePrefix + "-vid.mp4",
      };
    })
  );

  assertNonNull(videoAlignments, "some videos failed to generate");
  console.log(videoAlignments);
  fs.writeFile(
    projectDir + "alignments.json",
    JSON.stringify(videoAlignments, null, 2)
  );
  const res = await step06ffmpeg(apiFromCacheOr, {
    audio,
    alignment: videoAlignments,
  });
  fs.copyFile(res.meta.cachePrefix + "-merged.mp4", projectDir + "merged.mp4");
}

export type ImageSpeechAlignment = {
  startSeconds: number;
  endSeconds: number;
  prompt: string;
  speech: string;
};
function align(
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

void main();
