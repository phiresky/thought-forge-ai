import { TTSResponse, TTSResponseFinal } from "./step-02-text-to-speech";
import { promises as fs } from "fs";
const HEADER = `[Script Info]
Title: Default Aegisub file
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None
PlayResX: 640
PlayResY: 480

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Montserrat,43,&H00FFFFFF,&H000000FF,&HFF333333,&HFF000000,1,0,0,0,100,100,0,0,3,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

const stringifyTime = (time: number) => {
  // format: 0:21:19.60
  const hours = Math.floor(time / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((time % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  const milliseconds = Math.floor((time % 1) * 100)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export async function subtitles(props: {
  speech: TTSResponseFinal;
  outputFilename: string;
}) {
  const alignment = props.speech.data.alignment;

  const words = [];
  let cur = null;
  for (const [i, char] of alignment.characters.entries()) {
    const start = alignment.character_start_times_seconds[i];
    const end = alignment.character_end_times_seconds[i];
    if (char.match(/\s/)) {
      if (cur) {
        words.push(cur);
        cur = null;
      }
    } else {
      if (!cur) {
        cur = { start, end, text: char };
      } else {
        cur.end = end;
        cur.text += char;
      }
    }
  }
  if (cur) words.push(cur);
  const lines = wordLineMerge(words);
  const assLines = lines
    .map(
      (word) =>
        `Dialogue: 0,${stringifyTime(word.start)},${stringifyTime(
          word.end
        )},Default,,0,0,0,,${word.text}\n`
    )
    .join("");
  await fs.writeFile(props.outputFilename, HEADER + assLines);
}

type Word = { text: string; start: number; end: number };
function maybeSplit(words: Word[]): Word[][] {
  if (words.length < 7) return [words];
  const minWordCount = 2;
  const words2 = words.map((w, i) => ({
    ...w,
    gap: i >= minWordCount && i <= words.length - minWordCount ? w.end - words[i - 1]?.end : 0,
  }));
  const maxGap = Math.max(...words2.map((w) => w.gap));
  const splitInx = words2.findIndex((w) => w.gap === maxGap);
  return [
    ...maybeSplit(words.slice(0, splitInx)),
    ...maybeSplit(words.slice(splitInx)),
  ];
}
function wordLineMerge(words: Word[]) {
  const lines = [];
  let sentence = [];
  for (const word of words) {
    sentence.push(word);
    if (word.text.match(/[.,;!?]$/)) {
      lines.push(...maybeSplit(sentence));
      sentence = [];
    }
  }
  if (sentence.length > 0) lines.push(...maybeSplit(sentence));
  return lines.map((line) => ({
    start: line[0].start,
    end: line[line.length - 1].end,
    text: line.map((x) => x.text).join(" "),
  }));
}
