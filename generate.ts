import { step00FindTopic } from "./step-00-find-topic";
import { step01WriteScript as step01WriteMonologue } from "./step-01-write-monologue";
import { step02TextToSpeech } from "./step-02-text-to-speech";
import { step03TextToImagePrompt } from "./step-03-text-to-image-prompt";
import { step04TextToImage } from "./step-04-text-to-image";
import { step05ImageToVideo } from "./step-05-image-to-video";
import { apiFromCacheOr } from "./util/api-cache";
import { zeroStatsCounter } from "./util/stats";
import "dotenv/config";


async function main() {
    const statsCounter = zeroStatsCounter();
    const config = process.env as any;
    const topic = await step00FindTopic(apiFromCacheOr,config , statsCounter);
    console.log(topic);

    const monologue = await step01WriteMonologue(apiFromCacheOr, config, statsCounter, topic);
    console.log(monologue);
    const speech = await step02TextToSpeech(apiFromCacheOr, config, statsCounter, monologue);

    const prompts = await step03TextToImagePrompt(apiFromCacheOr, config, statsCounter, monologue);
    console.log(prompts)

    const prompt = prompts[0].prompt;
    const img1 = await step04TextToImage(apiFromCacheOr, config, prompt);
    const imageFilePath = img1.meta.cachePrefix + "-img.jpg";

    await step05ImageToVideo(apiFromCacheOr, config, prompt, imageFilePath);

}


void main();