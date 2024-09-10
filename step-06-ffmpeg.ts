import { ImageSpeechAlignment } from "./generate";
import { CacheOrComputer } from "./util/api-cache";
import child_process from "node:child_process";

export async function step06ffmpeg(
  apiFromCacheOr: CacheOrComputer,
  data: {
    audio: string;
    alignment: (ImageSpeechAlignment & { video: string })[];
  }
) {
  const result = await apiFromCacheOr(
    `local:ffmpeg-merge`,
    data,
    async (util) => {
        let filter = data.alignment
        .map(
            (e, i) => {
              const length = e.endSeconds - e.startSeconds;
              const setpts = (length > 10) ? `${length / 10}*PTS` : `PTS`;
            return `[${i + 1}:v]trim=0.00:${(length).toFixed(
              3
            )},setpts=${setpts}[v${i + 1}]; `
        }
        )
        .join("");
      filter +=
        data.alignment.map((e, i) => `[v${i + 1}]`).join("") +
        `concat=n=${data.alignment.length}:v=1:a=0[v]`;
        const cli = [
            "-i",
            data.audio,
            ...data.alignment.flatMap((e) => ["-i", e.video]),
            "-filter_complex",
            filter,
            "-map",
            "[v]",
            "-map",
            "0:a",
            "-crf",
            "21",
            util.cachePrefix + "-merged.mp4",
          ];
          console.log(cli);
      const cp = child_process.execFile("ffmpeg", cli);
      cp.stderr!.pipe(process.stderr);
      await new Promise<void>((res) => {
        cp.on("exit", (code) => {
          if (code !== 0) {
            throw Error(`ffmpeg exited with code ${code}`);
          }
          res();
        });
      });
    }
  );
  return result;
}
