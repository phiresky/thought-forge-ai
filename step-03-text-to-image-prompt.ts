import Anthropic from "@anthropic-ai/sdk";
import { CacheOrComputer } from "./util/api-cache";
import { StatsCounter } from "./util/stats";
import { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources";
import { FindTopicAiResponse } from "./step-00-find-topic";

const PROMPT = `
You are a director and producer specializing in deep thought TikTok content. Your task is to generate prompts for an image generation AI that will illustrate a given monologue. Follow these instructions carefully:

1. Here is the full monologue:
<monologue>
{{MONOLOGUE}}
</monologue>

2. Split the monologue into sensible segments of at least 10 up to 25 words each. These segments should correspond to approximately 5-10 seconds of spoken content.

3. For each segment, you will:
   a. Extract the exact text from the source monologue
   b. Generate a prompt for an image generation AI that visually represents the content or theme of that segment

4. When creating image prompts:
   - Focus on key concepts, emotions, or visual metaphors present in the text
   - Use descriptive language that will result in visually striking and thought-provoking images
   - Literal interpretations are find. Be careful the prompt is not too complex, otherwise the image generation will fail.
   - Include style directions like "surreal", "minimalist", or "photorealistic" when appropriate

5. Format your output as a JSON array, where each element is an object containing:
   - "text": The exact text segment from the monologue
   - "prompt": The corresponding image generation prompt

Here's an example of how your output should be structured:

${"```"}json
[
  {
    "text": "In the vastness of the cosmos, our planet is but a pale blue dot,",
    "prompt": "A tiny, luminous blue sphere floating in an endless, star-speckled black void, style: cosmic and awe-inspiring"
  },
  {
    "text": "a fragile oasis of life amidst the desolate cosmic desert.",
    "prompt": "A lush, green island surrounded by barren, red planetary landscapes, style: surreal contrast"
  }
]
${"```"}

6. Ensure that when all "text" fields are concatenated, they reproduce the entire input monologue exactly, without any omissions or additions.

7. Generate your response immediately, without any additional commentary or explanations outside of the JSON structure.

Begin processing the monologue now.
`;

export async function step03TextToImagePrompt(
  apiFromCacheOr: CacheOrComputer,
  config: { ANTHROPIC_API_KEY?: string; ANTHROPIC_MODEL?: string },
  statsCounter: StatsCounter,
  monologue: string
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
            text: PROMPT.replace(
              "{{MONOLOGUE}}",
              JSON.stringify(monologue, null, 2)
            ),
          },
        ],
      },
      {
        role: "assistant",
        content: [{ type: "text", text: "[" }],
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
  return JSON.parse("[" + msg.content[0].text) as {
    text: string;
    prompt: string;
  }[];
}
