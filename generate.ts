import { step00FindTopic } from "./step-00-find-topic";
import { step01WriteScript as step01WriteMonologue } from "./step-01-write-monologue";
import { step02TextToSpeech, TTSResponse } from "./step-02-text-to-speech";
import { step03TextToImagePrompt } from "./step-03-text-to-image-prompt";
import { step04TextToImage } from "./step-04-text-to-image";
import { step05ImageToVideo } from "./step-05-image-to-video";
import { step06ffmpeg } from "./step-06-ffmpeg";
import { apiFromCacheOr } from "./util/api-cache";
import { zeroStatsCounter } from "./util/stats";
import "dotenv/config";

async function main() {
  const statsCounter = zeroStatsCounter();
  const config = process.env as any;
  const topic = await step00FindTopic(apiFromCacheOr, config, statsCounter);
  console.log(topic);

  const monologue = await step01WriteMonologue(
    apiFromCacheOr,
    config,
    statsCounter,
    topic
  );
  console.log(monologue);
  const speech = await step02TextToSpeech(
    apiFromCacheOr,
    config,
    statsCounter,
    monologue
  );

  const iprompts = await step03TextToImagePrompt(
    apiFromCacheOr,
    config,
    statsCounter,
    monologue
  );
  const alignment = align(monologue, speech.data, iprompts);
  for (const prompt of alignment) {
    await step04TextToImage(apiFromCacheOr, config, prompt.prompt);
  }
  const videoAlignments = [];
  for (const prompt of alignment) {
    const img1 = await step04TextToImage(apiFromCacheOr, config, prompt.prompt);
    const imageFilePath = img1.meta.cachePrefix + "-img.jpg";
    const res = await step05ImageToVideo(
      apiFromCacheOr,
      config,
      prompt.prompt,
      imageFilePath
    );
    videoAlignments.push({
      ...prompt,
      video: res.meta.cachePrefix + "-vid.mp4",
    });
  }
  console.log(videoAlignments);
  step06ffmpeg(apiFromCacheOr, {audio: speech.meta.cachePrefix + "-audio.mp3", alignment: videoAlignments});
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
    if (monologue[0] === " " && prompt.text[0] !== " ") {
      prompt.text = " " + prompt.text;
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
