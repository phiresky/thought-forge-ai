import { CacheOrComputer } from "./util/api-cache";
import Replicate from "replicate";

export async function step07music(
  apiFromCacheOr: CacheOrComputer,
  config: {
    REPLICATE_API_KEY: string;
    REPLICATE_MUSIC_MODEL: `${string}/${string}`;
  },
  prompt: string,
  duration: number
) {
  if (!config.REPLICATE_API_KEY || !config.REPLICATE_MUSIC_MODEL)
    throw Error("no REPLICATE_API_KEY or REPLICATE_MUSIC_MODEL");
  const input = {
    //top_k: 250,
    //top_p: 0,
    prompt,
    duration: Math.ceil(duration),
    //temperature: 1,
    //continuation: false,
    model_version: "stereo-large",
    output_format: "mp3",
    //continuation_start: 0,
    //multi_band_diffusion: false,
    //normalization_strategy: "peak",
    //classifier_free_guidance: 3,
  };
  const res = await apiFromCacheOr(
    `https://dummy.replicate.com/${config.REPLICATE_MUSIC_MODEL}`,
    input,
    async (util) => {
      const replicate = new Replicate({
        auth: config.REPLICATE_API_KEY,
      });
      const output = (await replicate.run(config.REPLICATE_MUSIC_MODEL, {
        input,
      })) as unknown as string;
      const res = await fetch(output).then((res) => res.arrayBuffer());
      await util.writeCompanion("-music.mp3", new Uint8Array(res));
      return output;
    }
  );
  return { musicFileName: res.meta.cachePrefix + "-music.mp3" };
}
