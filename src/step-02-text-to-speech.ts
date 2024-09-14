import { ElevenLabs, ElevenLabsClient } from "elevenlabs";
import { FindTopicAiResponse } from "./step-00-find-topic";
import { CacheOrComputer, CacheResponse } from "./util/api-cache";
import { StatsCounter } from "./util/stats";

export type TTSResponse = {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
  normalized_alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
};
export type TTSResponseFinal = CacheResponse<TTSResponse> & {
  speechFileName: string;
};

export async function step02TextToSpeech(
  apiFromCacheOr: CacheOrComputer,
  config: {
    ELEVENLABS_API_KEY?: string;
    ELEVENLABS_MODEL?: string;
  },
  statsCounter: StatsCounter,
  topic: FindTopicAiResponse,
  monologue: string
): Promise<TTSResponseFinal> {
  if (!config.ELEVENLABS_API_KEY || !config.ELEVENLABS_MODEL)
    throw Error("no ELEVENLABS_API_KEY or ELEVENLABS_VOICE");
  const client = new ElevenLabsClient({ apiKey: config.ELEVENLABS_API_KEY });
  const voice = {
    ocean: "ddiq1IkwhtAlQgobNKtj",
    benjamin: "LruHrtVF6PSyGItzMNHS",
    stone: "NFG5qt843uXKj4pFvR7C",
    kyana: "3wZbmt7q1ZGa1v0w9nvu",
    afriba: "mNOhSS5ycP9b0Evtoi2U",
    rbbrelax: "7u4kUAtqvyfzaPCZV0V5",
  }[topic.voice];
  if (!voice) throw Error(`voice ${voice} not found`);
  const body: {
    voice: string;
    body: ElevenLabs.textToSpeech.TextToSpeechWithTimestampsRequest;
  } = {
    voice,
    body: {
      // output_format: ElevenLabs.OutputFormat.Mp32205032,
      text: monologue,
      model_id: config.ELEVENLABS_MODEL,
      // language_code: "en-US",
      /*voice_settings: {
      stability: 0.1,
      similarity_boost: 0.3,
      style: 0.2,
    },*/
    },
  };
  const r = await apiFromCacheOr("elevenlabs.io", body, async (util) => {
    const resp = (await client.textToSpeech.convertWithTimestamps(
      body.voice,
      body.body
    )) as TTSResponse;
    await util.writeCompanion(
      "-audio.mp3",
      Buffer.from(resp.audio_base64, "base64")
    );
    return resp;
  });
  return { speechFileName: r.meta.cachePrefix + "-audio.mp3", ...r };
}
