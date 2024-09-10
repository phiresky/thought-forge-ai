import { ElevenLabsClient, ElevenLabs } from "elevenlabs";
import { CacheOrComputer } from "./util/api-cache";
import { StatsCounter } from "./util/stats";

type TTSResponse = {
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
export async function step02TextToSpeech(
  apiFromCacheOr: CacheOrComputer,
  config: {
    ELEVENLABS_API_KEY?: string;
    ELEVENLABS_MODEL?: string;
    ELEVENLABS_VOICE?: string;
  },
  statsCounter: StatsCounter,
  monologue: string
) {
  if (
    !config.ELEVENLABS_API_KEY ||
    !config.ELEVENLABS_VOICE ||
    !config.ELEVENLABS_MODEL
  )
    throw Error("no ELEVENLABS_API_KEY or ELEVENLABS_VOICE");
  const client = new ElevenLabsClient({ apiKey: config.ELEVENLABS_API_KEY });
  const body: {
    voice: string;
    body: ElevenLabs.textToSpeech.TextToSpeechWithTimestampsRequest;
  } = {
    voice: config.ELEVENLABS_VOICE,
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
    const resp = await client.textToSpeech.convertWithTimestamps(
      body.voice,
      body.body
    ) as TTSResponse;
    await util.writeCompanion("-audio.mp3", Buffer.from(resp.audio_base64, "base64"));
    return resp;
  });
  console.log(r);
  return r;
}
