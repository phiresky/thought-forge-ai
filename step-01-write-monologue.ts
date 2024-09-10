import Anthropic from "@anthropic-ai/sdk";
import { CacheOrComputer } from "./util/api-cache";
import { StatsCounter } from "./util/stats";
import { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources";
import { FindTopicAiResponse } from "./step-00-find-topic";

const PROMPT = `
You are a writer and director specializing in deep thought TikTok content. Your task is to generate a 30-second monologue about a given topic. It can be in the style of a poem, of a story, or in the style of Alan Watts. This monologue should be designed to captivate viewers and provide profound insights.

Follow these guidelines for the monologue structure:
1. Start with an attention-catching statement that people can relate to (e.g., "If you've recently ended a relationship...")
2. Develop the content to be generic enough to resonate with a wide audience
3. Conclude with a deep insight about life, love, or the given topic

When crafting the monologue, emulate Alan Watts' speech style:
- Use a contemplative and philosophical tone
- Employ metaphors and analogies to illustrate complex ideas
- Maintain a general voice rather than directly addressing the audience
- Blend Eastern philosophy with Western concepts when appropriate

The topic for your monologue is:
<topic>
{{TOPIC}}
</topic>

Generate a 30 to 60 second monologue (approximately 70-140 words) based on this topic. Ensure that your monologue adheres to the structure and style guidelines provided above. Remember to start with an attention-grabbing statement, develop relatable content, and end with a profound insight.

Output purely the monologue, nothing else.

Here is some example monologues for reference:
Example 1:
<monologue>
</monologue>

Example 2:
<monologue>
</monologue>

Example 3:
<monologue>
</monologue>
`;

export async function step01WriteScript(
  apiFromCacheOr: CacheOrComputer,
  config: { ANTHROPIC_API_KEY?: string; ANTHROPIC_MODEL?: string },
  statsCounter: StatsCounter,
  topic: FindTopicAiResponse
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
            text: PROMPT.replace("{{TOPIC}}", JSON.stringify(topic, null, 2)),
          },
        ],
      },
      /*{
        role: "assistant",
        content: [{ type: "text", text: "{" }],
      },*/
    ],
  };
  const msg = (await apiFromCacheOr(
    "https://fakeurl.anthropic.com/anthropic.messages.create",
    body,
    async () => {
      const msg = await anthropic.messages.create(body);
      return msg;
    }
  )).data;
  statsCounter.api_calls += 1;
  statsCounter.input_tokens += msg.usage.input_tokens;
  statsCounter.output_tokens += msg.usage.output_tokens;
  console.assert(msg.content.length === 1);
  if (!(msg.content[0].type === "text")) throw Error("unexpected message type");
  return msg.content[0].text;
}
