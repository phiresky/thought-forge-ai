import Anthropic from "@anthropic-ai/sdk";
import { CacheOrComputer } from "./util/api-cache";
import { StatsCounter } from "./util/stats";
import { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources";

const SYSTEM_PROMPT = `
You are tasked with generating a topic for a deep, insightful TikTok-style short video that resonates with many people but has a specific insight. This topic should be suitable for creating engaging, thought-provoking content that can capture viewers' attention quickly and leave a lasting impression.

Guidelines for generating the TikTok topic:

1. The topic should be relatable to a wide audience but offer a unique perspective.
2. It should be concise enough to be explored in a short video format (15-60 seconds).
3. The topic should provoke thought, emotion, or self-reflection.
4. It should be based on a specific insight that isn't immediately obvious.
5. The topic should be relevant to current social, cultural, or personal issues.


Structure your output as follows:

1. Specific Topic: A concise statement of the topic (1-2 sentences)
2. Key Insight: The unique perspective or revelation within the topic (1-2 sentences)
3. Relevance: Why this topic resonates with many people (2-3 sentences)
4. Potential Impact: How this topic could affect viewers' thinking or behavior (1-2 sentences)
5. Clickbait Title: How the Instagram Reels/TikTok/Youtube Short should be titled to catch attention.
6. Instagram Hashtags: A set of hashtags to add to the instagram reel.

Topic examples:
<topic>Life advice on personal growth, relationships, and maintaining a positive mindset</topic>
<topic>Realizing that true happiness comes from within and is not dependent on external factors</topic>
<topic>Embracing the concept of one's own mortality as a means to live more fully</topic>
<topic>Self-love, personal growth, and recognizing one's own worthiness and holiness</topic>
<topic>Understanding and supporting overthinkers in relationships</topic>
<topic>The importance of self-love and positive self-talk for personal well-being</topic>
<topic>Expressing deep, unconditional love that surpasses all obstacles</topic>
<topic>The complex and contradictory nature of human emotions and behavior</topic>
<topic>The transformative power of unexpected love in one's life</topic>
<topic>The profound impact of a special person on one's perception and emotions</topic>
<topic>The concept of soulmates and enduring love across time and circumstances</topic>
<topic>Psychological truths about relationships, self-worth, and personal growth</topic>
<topic>The relationship between anger, grief, and past trauma in personal growth</topic>
<topic>The challenges and unique perspective of highly intelligent individuals</topic>


Full output example:

{
    "topic": "The unexpected link between boredom and creativity in the digital age",
    "key_insight": "Constant digital stimulation may be hindering our ability to tap into the creative potential that comes from embracing boredom",
    "relevance": "In an era of smartphones and endless entertainment options, many people rarely experience true boredom. This constant engagement may be impacting our ability to think creatively and generate novel ideas, which are crucial skills in both personal and professional contexts.",
    "potential_impact": "This topic could inspire viewers to intentionally disconnect from digital devices and embrace moments of boredom, potentially unlocking new levels of creativity and problem-solving abilities.",
    "clickbait_title": "Bored? Embrace it.",
    "instagram_hashtags": "#deepmindthoughts #deepthoughtswithhuggybear #deepthoughtsatnight #yqdeepthoughts #dork #sadmood #hatersgonnahate #writerslife #thoughtsoftheday #brokenfeelings #wordsforthought #2amthoughts #turnaround #disappointment #sadthoughts #beautifulmind #braveheart #vulnerable #britishmuseum #philosophyquotes #philosophers #quotesofinsta #wordsmiths #masculinewomen #dailyperspective"
}`;

export type FindTopicAiResponse = {
  topic: string;
  key_insight: string;
  relevance: string;
  potential_impact: string;
  clickbait_title: string;
  instagram_hashtags: string;
};

export async function step00FindTopic(
  apiFromCacheOr: CacheOrComputer,
  config: { ANTHROPIC_API_KEY?: string; ANTHROPIC_MODEL?: string },
  statsCounter: StatsCounter
): Promise<FindTopicAiResponse> {
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
            text: SYSTEM_PROMPT,
          },
        ],
      },
      {
        role: "assistant",
        content: [{ type: "text", text: "{" }],
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
  return JSON.parse("{" + msg.content[0].text);
}
