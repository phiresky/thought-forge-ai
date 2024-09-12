import { promisify } from "node:util";
import { ImageSpeechAlignment } from "./util/align-video";
import { CacheOrComputer } from "./util/api-cache";
import child_process from "node:child_process";
import path from "node:path";

async function getLoudnessTarget(
  fileName: string,
  p: { i: number; lra: number; tp: number }
) {
  const exe = promisify(child_process.execFile);
  const cp = await exe("ffmpeg", [
    "-i",
    fileName,
    "-af",
    `loudnorm=I=${p.i}:LRA=${p.lra}:TP=${p.tp}:print_format=json:dual_mono=true`,
    "-f",
    "null",
    "-",
    "-hide_banner",
    "-nostats",
  ]);
  const js = cp.stderr.match(/\{(.|\n)+\}/);
  if (!js) throw Error(`no json in ${cp.stderr}`);
  const res = JSON.parse(js[0]) as {
    input_i: "-14.31";
    input_tp: "-1.63";
    input_lra: "4.30";
    input_thresh: "-24.31";
    output_i: "-23.51";
    output_tp: "-10.78";
    output_lra: "3.60";
    output_thresh: "-33.51";
    normalization_type: "dynamic";
    target_offset: "-0.49";
  };
  return `loudnorm=I=${p.i}:LRA=${p.lra}:TP=${p.tp}:measured_I=${res.input_i}:measured_LRA=${res.input_lra}:measured_TP=${res.input_tp}:measured_thresh=${res.input_thresh}:offset=${res.target_offset}:linear=true:print_format=json:dual_mono=true`;
}
export async function step09ffmpeg(
  apiFromCacheOr: CacheOrComputer,
  data: {
    speech: string;
    music: string;
    subtitles: string;
    alignment: (ImageSpeechAlignment & { video: string })[];
  }
) {
  const result = await apiFromCacheOr(
    `local:ffmpeg-merge`,
    data,
    async (util) => {
      // https://k.ylo.ph/2016/04/04/loudnorm.html
      const speechLoudness = await getLoudnessTarget(data.speech, {
        i: -16,
        lra: 11,
        tp: -1,
      });
      const musicLoudness = await getLoudnessTarget(data.music, {
        i: -28,
        lra: 7,
        tp: -2,
      });
      const audioCount = 2;
      const fadeOutStart = data.alignment.slice(-1)[0].endSeconds - 1;
      let filter = data.alignment
        .map((e, i) => {
          const length = e.endSeconds - e.startSeconds;
          const setpts = length > 10 ? `${length / 10}*PTS` : `PTS`;
          return `[${i + audioCount}:v]trim=0.00:${length.toFixed(
            3
          )},setpts=${setpts}[v${i}]; `;
        })
        .join("");
      const inputWidth = 1280;
      const outputWidth = 900;
      const outputRatio = 4 / 5;
      const outputHeight = Math.round(outputWidth / outputRatio);
      const outputPaddingTop = 0.1 * outputHeight;
      const escapedSubtitleFilename = data.subtitles.replace(/'/g, "\\\\\\'");
      filter +=
        data.alignment.map((e, i) => `[v${i}]`).join("") +
        `concat=n=${data.alignment.length}:v=1:a=0[video]; [video]crop=w=${outputWidth},pad=h=${outputHeight}:y=${outputPaddingTop},subtitles=filename=${escapedSubtitleFilename}[videocrop]`;
      const cli = [
        "-i",
        data.speech,
        "-i",
        data.music,
        ...data.alignment.flatMap((e) => ["-i", e.video]),
        "-filter_complex",
        filter,
        "-filter_complex",
        // need to make the speech stereo first otherwise output will be mono
        `[0:a][0:a]amerge=inputs=2[spmono]; [spmono]${speechLoudness}[speech]; [1:a]${musicLoudness}[music]; [speech][music]amix=inputs=2,afade=type=out:start_time=${fadeOutStart}:duration=1[audio]`,
        "-map",
        "[videocrop]",
        "-map",
        "[audio]",
        "-ar",
        "44100",
        "-crf",
        "21",
        // ffmpeg does not want to copy input frame rate from a concat filter i guess
        "-r",
        "24", // -fps_mode passthrough
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
  return { ...result, videoFileName: result.meta.cachePrefix + "-merged.mp4" };
}
