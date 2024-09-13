import Anthropic from "@anthropic-ai/sdk";
import { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources";
import { CacheOrComputer } from "./util/api-cache";
import { StatsCounter } from "./util/stats";

const PROMPT = `
You are tasked with generating 10 topics for deep, insightful TikTok-style short video that resonates with many people but has a specific insight. This topic should be suitable for creating engaging, thought-provoking content that can capture viewers' attention quickly and leave a lasting impression.

Guidelines for generating the TikTok topic:

1. The topic should be relatable to a wider audience but offer a unique perspective.
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
7. Voice: The ID of the most fitting voice to use, from the below list.

Voice IDs:
- "ocean": Ocean - Monotonous Voice. Yogi Voice for Guided Meditations and Philosophical Storytelling. Labels: English (American), Calm, Male, Middle-Aged, Narrative & Story
- "benjamin": Benjamin - Deep, Warm, Calming. A gentle and warm Middle Age American voice to soothe and relax you. Suitable for all types of narration but specially designed for applications like ASMR and Guided Visualization relaxation applications. Labels: Middle Aged, Male, English, Narrative & Story
- "stone": Adam Stone - late night radio. A middle aged 'Brit' with a velvety laid back, late night talk show host timbre. Labels: Middle Aged, Male, English, Narrative & Story
- "cook": Kyana Cook - Middle aged female American voice with a slight accent. A feminine voice that delivers soft and alluring tone . Something that sounds sensational. Great for Audiobooks. Labels: Middle Aged, Female, English, Narrative & Story
- "afriba": Young British female with a Sad tone. Works well for Storytelling. Young, Female, Narrative & Story

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


Output 10 different topics. Output example:

[{
    "topic": "The unexpected link between boredom and creativity in the digital age",
    "key_insight": "Constant digital stimulation may be hindering our ability to tap into the creative potential that comes from embracing boredom",
    "relevance": "In an era of smartphones and endless entertainment options, many people rarely experience true boredom. This constant engagement may be impacting our ability to think creatively and generate novel ideas, which are crucial skills in both personal and professional contexts.",
    "potential_impact": "This topic could inspire viewers to intentionally disconnect from digital devices and embrace moments of boredom, potentially unlocking new levels of creativity and problem-solving abilities.",
    "clickbait_title": "Bored? Embrace it.",
    "instagram_hashtags": "#deepmindthoughts #deepthoughtswithhuggybear #deepthoughtsatnight #yqdeepthoughts #dork #sadmood #hatersgonnahate #writerslife #thoughtsoftheday #brokenfeelings #wordsforthought #2amthoughts #turnaround #disappointment #sadthoughts #beautifulmind #braveheart #vulnerable #britishmuseum #philosophyquotes #philosophers #quotesofinsta #wordsmiths #masculinewomen #dailyperspective",
    "voice": "ocean"
}, ...]`;

export type FindTopicAiResponse = {
  topic: string;
  key_insight: string;
  relevance: string;
  potential_impact: string;
  clickbait_title: string;
  instagram_hashtags: string;
  voice: string;
};

// If count > 10, do multiple calls to get more topics
export async function step00FindTopic(
  apiFromCacheOr: CacheOrComputer,
  config: { ANTHROPIC_API_KEY?: string; ANTHROPIC_MODEL?: string },
  statsCounter: StatsCounter,
  seed: number,
  count: number
): Promise<FindTopicAiResponse[]> {
  if (count > 100) throw Error("prompt too long");
  const key = config.ANTHROPIC_API_KEY;
  if (!key || !config.ANTHROPIC_MODEL) throw Error("no ANTHROPIC_API_KEY");
  const previousResults: Anthropic.Messages.MessageParam[] = [];
  const oldTopics: FindTopicAiResponse[] = [];
  const iteration = Math.floor((count - 1) / 10);
  for (let i = 0; i < iteration; i++) {
    const topics = await step00FindTopic(
      apiFromCacheOr,
      config,
      statsCounter,
      seed,
      (i + 1) * 10
    );
    topics.splice(0, topics.length - 10);
    previousResults.push({
      role: "assistant",
      content: [{ type: "text", text: JSON.stringify(topics, null, 2) }],
    });
    previousResults.push({
      role: "user",
      content: [{ type: "text", text: "Ten more topics" }],
    });
    oldTopics.push(...topics);
  }
  const anthropic = new Anthropic({ apiKey: key });
  const model = config.ANTHROPIC_MODEL;
  const body: MessageCreateParamsNonStreaming & { seed: number } = {
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
            text: PROMPT,
          },
        ],
      },
      ...previousResults,
      {
        role: "assistant",
        content: [{ type: "text", text: "[" }],
      },
    ],
    seed,
  };
  const msg = (
    await apiFromCacheOr(
      "https://fakeurl.anthropic.com/anthropic.messages.create",
      body,
      async () => {
        const { seed, ...bodey } = body;
        const msg = await anthropic.messages.create(bodey);
        return msg;
      }
    )
  ).data;
  statsCounter.api_calls += 1;
  statsCounter.input_tokens += msg.usage.input_tokens;
  statsCounter.output_tokens += msg.usage.output_tokens;
  console.assert(msg.content.length === 1);
  if (!(msg.content[0].type === "text")) throw Error("unexpected message type");
  return [...oldTopics, ...JSON.parse("[" + msg.content[0].text)];
}
