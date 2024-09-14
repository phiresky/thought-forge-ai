import "dotenv/config";
import { promises as fs } from "fs";
import { step00FindTopic as step00FindTopics } from "./step-00-find-topic";
import { step01WriteScript as step01WriteMonologue } from "./step-01-write-monologue";
import { step02TextToSpeech, TTSResponseFinal } from "./step-02-text-to-speech";
import { step03TextToImagePrompt } from "./step-03-text-to-image-prompt";
import { step06TextToMusicPrompt } from "./step-06-text-to-music-prompt";
import { step07music } from "./step-07-music";
import { step08subtitles } from "./step-08-subtitles";
import { step09ffmpeg } from "./step-09-ffmpeg";
import {
  alignSpeech,
  alignVideo,
  ImageSpeechVideoAlignment,
} from "./util/align-video";
import { apiFromCacheOr } from "./util/api-cache";
import { StatsCounter, zeroStatsCounter } from "./util/stats";

const outRoot = `data/videos`;
async function main() {
  const statsCounter = zeroStatsCounter();
  const config = process.env as any;
  const task = process.argv[2];
  if (task === "generate-topics") {
    const seed = 1352242560; // (Math.random() * Number.MAX_SAFE_INTEGER) | 0;
    const maxVideos = 40;
    const topics = await step00FindTopics(
      apiFromCacheOr,
      config,
      statsCounter,
      seed,
      maxVideos
    );
    console.log(
      "topics:\n",
      topics
        .map(
          (p, i) => `Topic ${i}: ${p.clickbait_title} (${p.topic}) (${p.voice})`
        )
        .join("\n")
    );

    const choice = +process.argv[3];
    if (isNaN(choice)) throw Error("no topic chosen");
    const topic = topics[choice];
    console.log("chosen topic", choice, topic);
    await generateVideo(choice, topic, config, statsCounter, seed);
  } else if (task === "from-topic") {
    const topic = process.argv[3];
    if (!topic) throw Error("no topic");
    await generateVideo(
      await chooseFolderIndex(outRoot, 101),
      {
        clickbait_title: topic,
        topic,
        voice: "ocean",
      },
      config,
      statsCounter
    );
  } else {
    throw Error("unknown task");
  }
}
async function generateVideo(
  choice: number,
  topic: { clickbait_title: string; voice: string; topic: string },
  config: any,
  statsCounter: StatsCounter,
  seed = 0
) {
  const projectDir = `${outRoot}/${choice
    .toString()
    .padStart(3, "0")} ${topic.clickbait_title.replace(/\//g, "")}/`;
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(projectDir + "topic.json", JSON.stringify(topic, null, 2));
  if (seed)
    await fs.writeFile(projectDir + "seed.json", JSON.stringify(seed, null, 2));
  console.log("writing monologue");
  // having cook in there sometimes makes the AI think it should be about cooking, but I don't want to change it to not bust the cache.
  if (topic.voice === "cook") topic.voice = "kyana";
  const monologue = await step01WriteMonologue(
    apiFromCacheOr,
    config,
    statsCounter,
    topic
  );
  await fs.writeFile(projectDir + "monologue.txt", monologue);
  console.log("monologue", monologue);
  console.time("tts");
  const speech = await step02TextToSpeech(
    apiFromCacheOr,
    config,
    statsCounter,
    topic,
    monologue
  );
  await fs.copyFile(speech.speechFileName, projectDir + "speech.mp3");
  console.timeEnd("tts");
  console.time("image prompts");
  const iprompts = await step03TextToImagePrompt(
    apiFromCacheOr,
    config,
    statsCounter,
    monologue
  );
  console.timeEnd("image prompts");

  const pauseAfterSeconds = 1;
  // these can be done simultaneously
  const [videoAlignments, music] = await Promise.all([
    doVideo(projectDir, config, monologue, speech, iprompts, pauseAfterSeconds),
    doMusic(
      speech,
      monologue,
      projectDir,
      config,
      statsCounter,
      pauseAfterSeconds
    ),
  ]);

  const subtitleFileName = projectDir + "subtitles" + ".ass";
  await step08subtitles({ speech, outputFilename: subtitleFileName });
  const res = await step09ffmpeg(apiFromCacheOr, {
    speech: speech.speechFileName,
    subtitles: subtitleFileName,
    music: music.musicFileName,
    alignment: videoAlignments,
  });
  fs.copyFile(res.videoFileName, projectDir + "merged.mp4");
}

type Config = any;

async function doVideo(
  projectDir: string,
  config: Config,
  monologue: string,
  speech: TTSResponseFinal,
  iprompts: { text: string; prompt: string }[],
  pauseAfterSeconds: number
) {
  const alignment = alignSpeech(
    monologue,
    speech.data,
    iprompts,
    pauseAfterSeconds
  );
  const _videoAlignments: PromiseSettledResult<ImageSpeechVideoAlignment>[] =
    await alignVideo(alignment, config, projectDir);
  const videoAlignments = _videoAlignments.map((p) => {
    if (p.status === "fulfilled") return p.value;
    else throw Error("at least one video failed to generate: " + p.reason);
  });

  console.log(videoAlignments);
  await fs.writeFile(
    projectDir + "alignments.json",
    JSON.stringify(videoAlignments, null, 2)
  );
  return videoAlignments;
}
async function doMusic(
  speech: TTSResponseFinal,
  monologue: string,
  projectDir: string,
  config: Config,
  statsCounter: StatsCounter,
  pauseAfterSeconds: number
) {
  const musicDuration =
    speech.data.alignment.character_end_times_seconds.slice(-1)[0] +
    pauseAfterSeconds;
  console.log("music duration", musicDuration);
  const musicPrompt = await step06TextToMusicPrompt(
    apiFromCacheOr,
    config,
    statsCounter,
    monologue,
    musicDuration
  );
  await fs.writeFile(projectDir + "music-prompt.txt", musicPrompt);
  const music = await step07music(
    apiFromCacheOr,
    config,
    musicPrompt,
    musicDuration
  );
  await fs.copyFile(music.musicFileName, projectDir + "music.mp3");
  return music;
}
void main();

async function chooseFolderIndex(dir: string, start: number) {
  const l = new Set(
    (await fs.readdir(dir)).flatMap((x) => {
      const n = x.match(/^\d+/);
      if (!n) return [];
      return [+n[0]];
    })
  );
  for (let i = start; ; i++) {
    if (!l.has(i)) return i;
  }
}
