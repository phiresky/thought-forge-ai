import * as fal from "@fal-ai/serverless-client";
import { CacheOrComputer } from "./util/api-cache";

// we could use replicate.com here just as we do for music so we don't need an extra account

export async function step04TextToImage(
  apiFromCacheOr: CacheOrComputer,
  config: {
    FAL_KEY?: string;
    FAL_MODEL?: string;
  },
  prompt: string
) {
  if (!config.FAL_KEY || !config.FAL_MODEL)
    throw Error("no FAL_KEY or FAL_MODEL");
  fal.config({ credentials: config.FAL_KEY });
  const model = config.FAL_MODEL;
  const input = {
    prompt,
    image_size: "landscape_16_9",
    sync_mode: true,
  };
  const result = await apiFromCacheOr(
    `https://fal.run/${model}`,
    input,
    async (util) => {
      const result = (await fal.run(model, {
        input,
        /*logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },*/
      })) as { images: { url: string }[] };
      const img = result.images[0].url;
      const imgBlob = await fetch(img).then((res) => res.arrayBuffer());
      await util.writeCompanion("-img.jpg", new Uint8Array(imgBlob));
      return result;
    }
  );
  return { ...result, imageFilePath: result.meta.cachePrefix + "-img.jpg" };
}
