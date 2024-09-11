import Anthropic from "@anthropic-ai/sdk";
import { CacheOrComputer } from "./util/api-cache";
import { StatsCounter } from "./util/stats";
import { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources";
import { FindTopicAiResponse } from "./step-00-find-topic";

const PROMPT = `
You are a writer and director specializing in deep thought TikTok content. Your task is to generate an AI prompt for a music generation AI to create background music for a {{DURATION}}-second monologue. This music should enhance the emotional impact and complement the content of the monologue.

Here is the monologue:
<monologue>
{{MONOLOGUE}}
</monologue>

To create an effective AI prompt for background music, follow these steps:

1. Analyze the monologue:
   - Identify the overall tone (e.g., contemplative, uplifting, melancholic)
   - Note any emotional shifts or key moments
   - Consider the pacing and rhythm of the speech

2. Determine the musical elements that would complement the monologue:
   - Genre or style
   - Tempo
   - Instrumentation
   - Mood or atmosphere

3. Think about how the music should evolve over the duration:
   - Should it have a consistent feel throughout?
   - Are there moments where the music should intensify or soften?
   - Consider any natural pauses or emphases in the monologue where the music could respond

4. Generate an AI prompt that incorporates these elements. Your prompt should be detailed and specific, guiding the music generation AI to create a soundtrack that enhances the monologue without overpowering it. Note that the music generator has no access to the monologue. Clarify that the output is instrumental.

Output ONLY the AI prompt. Aim for a prompt of 3-5 sentences that clearly conveys the desired musical characteristics and how they should align with the monologue.
`;

export async function step07TextToMusicPrompt(
  apiFromCacheOr: CacheOrComputer,
  config: { ANTHROPIC_API_KEY?: string; ANTHROPIC_MODEL?: string },
  statsCounter: StatsCounter,
  monologue: string,
  durationSeconds: number
) {
  const key = config.ANTHROPIC_API_KEY;
  if (!key || !config.ANTHROPIC_MODEL) throw Error("no ANTHROPIC_API_KEY");
  const anthropic = new Anthropic({ apiKey: key });
  const model = config.ANTHROPIC_MODEL;
  const body: MessageCreateParamsNonStreaming = {
    model,
    max_tokens: 4096,
    // temperature: 0,
    // system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: PROMPT.replace("{{MONOLOGUE}}", monologue).replace(
              "{{DURATION}}",
              `${Math.ceil(durationSeconds)}`
            ),
          },
        ],
      },
    ],
  };
  const msg = (
    await apiFromCacheOr(
      "https://fakeurl.anthropic.com/anthropic.messages.create",
      body,
      async () => {
        const msg = await anthropic.messages.create(body);
        return msg;
      }
    )
  ).data;
  statsCounter.api_calls += 1;
  statsCounter.input_tokens += msg.usage.input_tokens;
  statsCounter.output_tokens += msg.usage.output_tokens;
  console.assert(msg.content.length === 1);
  if (!(msg.content[0].type === "text")) throw Error("unexpected message type");
  return msg.content[0].text;
}
