import Anthropic from "@anthropic-ai/sdk";
import { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources";
import { FindTopicAiResponse } from "./step-00-find-topic";
import { CacheOrComputer } from "./util/api-cache";
import { StatsCounter } from "./util/stats";

const PROMPT = `
Craft a monologue or story based on the given topic. Orient yourself by the examples.
Prefer to be bold to being boring. It is better if your monologue is controversial yet captivating rather than unoffensive but boring and bland. If you write a story, make it heartfelt and emotional.

The topic for your monologue is:
<topic>
{{TOPIC}}
</topic>


Generate a 30 to 50 second monologue (approximately 60-120 words) based on this topic. End your monologue in a profound statement.

Output purely the monologue, nothing else.

Here is some example monologues for reference:

<monologue>
12 things you need to understand 1. When you're winning, keep your mouth shut. 2. Don't tell people your plans. Wait till the results speak for themselves. 3. Never expect to get what you give. Not everyone has a heart of flesh. 4. Everyday you wake up, you have a new job to be better than yesterday. 5. You will never get what you want until you are grateful for what you have. Six. Sometimes what you're trying to hold on to is exactly what you should let go of. 7. If you want to buy things without looking at the price, work without looking at the clock. 8. God puts people in your life for a reason and removes them from your life for a better reason. 9. The devil wouldn't be attacking you so hard if there wasn't something valuable in you. Thieves don't break into empty houses. 10. You're going to set a lot of people off when you start doing what's best for you. 11. You will lose a lot of friends when you get really serious about your life goals. 12. Life does not get easier, you just get stronger.
</monologue>

<monologue>
To realise it one day. That happiness was never about your job or your degree or being in a relationship. Happiness was never about following in the footsteps of all of those who came before you. It was never about being like the others. One day you're going to see it. That happiness was always about the discovery, the hope, the listening to your heart and following it wherever it chose to go. Happiness was always about being kinder to yourself. It was always about embracing the person you were becoming. One day you will understand that happiness was always about learning how to live with yourself. That your happiness was never in the hands of others. One day you'll realise the true happiness comes from within and no external factors can define it was always about you. It was always about you. This comes from within and no external factors can define it.
</monologue>

<monologue>
Regard yourself as dead already, so that you have nothing to lose. Turkish proverb says he who sleeps on the floor will not fall out of bed. So in the same way, the person who regards himself as already dead, who. Therefore you are virtually nothing. 100 years from now, you'll be a handful of dust. That'll be for real, alright. Act on that reality. And out of that nothing, you will suddenly surprise yourself that the more you know you're nothing, the more you'll amount to something.
</monologue>

<monologue>
But it involves not one other person “Why do I react to it as I do?” To perceive It's the voice of that very small child You have holy work to do the authority initially it involves yourself. You cannot push people into the Garden of Eden “What is this about?” Until you can love yourself from the outside. The moment that you recognize But that is not your concern. is to learn who you are. Until you can know your own holiness that you are worthy of the Garden of Eden and to choose love. it will be there. the human being It's not so far. where there is fear and where there is love And you are worthy within that body, You can only from the inside the opportunity to look around and say but the responsibility not forcing. Allowing. and I say that word lovingly. open the gate and invite them. It's waiting inside you in the sanctuary. you cannot love another. Everything without exception with who you are and You the soul is an educational tool. To offer You Allowing all of you. is not to win or lose. “I remember who I am” That is all that is necessary. that you are truly in love that says to be what you wanted to be. that at every given moment of your life, What is the indicator “What can I learn from this?” you cannot honor another. To recognize in your human world “Why have I allowed it to come into my life?” So what is the task So you must get there first. and so is everyone else. “Why have I perceived it as I have?” for all of you? is that you are allowing your life you have not only the right The purpose of human life The purpose of human experience
</monologue>

<monologue>
According to psychology, the biggest problem for overthinkers is that when they get too attached to someone, their entire mood depends on how the other person responds to them. They are so attuned to other people's emotions that they can notice the slightest change in someone's behavior. Learn to regulate your emotions. If you are being controlled by your own emotions, you will end up hurting either yourself or them in the end. So if you love an overthinker, there are things you need to know. Their neediness isn't simply neediness. It's fear. I promise you, no one is more tired by their overactive mind than they are. They live with it every day and wish they could live life without the dozen hypotheticals invading each moment. But they can't. It's sometimes difficult to see, but there is beauty in overthinking. Those people who are most afraid to hurt are also the ones who love the most. If you love an overthinker, you should appreciate that. Be there for them. Tell them you're not going away. Reassure them. They are still learning to trust. They're learning to let go of their fears because the one before you walked away after love got a little hard. They're fighting every day to win the biggest battle. Battle against their own mind.
</monologue>

<monologue>
I suggest that you get up  in the morning and the first thing you do is you go to the mirror, before you go  to the bathroom or do anything. When you're really  at your most delightful go to the mirror and say, “I love you” “What can I do for you today to make you happy?” And you may not get an answer for a while because, that part of you doesn't trust you. But if you start doing that you'll find a very good connection. A very healing thing to do is just a couple of  times a day for a month or so, is to look in a mirror in your own eyes and say “I really, really love you” And just let all those feelings come up and notice them. And if it's difficult for you  to do that notice that it's difficult for you to look in your own eyes and say, And ask yourself, Now, where did that nonsense come from? Remember little tiny babies when they're born, they absolutely adore themselves and they're totally open, and they're full of love. They express  themselves freely. They ask for  what they want. They love their bodies from the top of their head to the tip of their toes. Because nobody's  taught them guilt and shame, they know how  wonderful they are. And then somewhere  along the line we get this idea that we're not good enough. And we start putting tape measures around  our waistline to tell us if we're acceptable. Or we read magazines that say we have to be  a certain height, or a certain weight before we're acceptable. Or we listen to the media that says we have to use  a certain deodorant before we're acceptable. It just doesn't make sense. We are absolutely divine, magnificent expressions  of life all of us.
</monologue>

<monologue>
If I ever say I love you more, I don't just mean I love you more than you love me. I mean, I love you more than all the bad days ahead of us. I mean, I love you more than any distance between us. I love you more than any person who tries to get between us. I love you more than any fight we ever have. I love you more than any imperfection you think you have. I mean, I love you more than I love myself. I mean, I love you more than everything.
</monologue>

<monologue>
I'm paradoxical. I like to be happy, but I think about sad things all the time. I don't really like myself, but I love the person I've become. I say I don't care, but I just care too much. Deep into my bones, I crave attention, yet I reject everything that comes my way. I healed people, but I broke my own heart trying to fix them. I love to listen, but I never tell them what's inside me. A living contradiction, that's what I am.
</monologue>

<monologue>
How beautiful is this quote? I didn't love you because I was lonely. Far from it. I was at peace in my own world, wrapped in the comfort of solitude. But then you appeared. Like a comet streaking across my night sky. Your presence was more than just a spark. It was a blaze that lit up my entire existence. You made me open my eyes again. To see the world in vivid color. To feel life pulsing around me. With you every day as a revelation. A journey into a world I never knew existed. Losing you would be unimaginable. Like being plunged back into darkness. It would leave a void so profound I doubt I could ever find my way back. Before you, my life felt like a distant memory. A chapter from another book. Nothing Else Matters as long as I'm with you.
</monologue>

<monologue>
She guessed my favourite colour on the first try, but between you and me, I didn't even have a favourite colour until she yelled out yellow! She was excited and smiling like a little kid. So I told her she was right and I haven't seen yellow the same since. It's in everything. I could probably live in it now. She is the most beautiful pattern of beauty on the fabric of love. She is a poem and a painting too. Everything she said sounded like a song, and every silence was music. She is an old soul with young eyes, a vintage heart and a beautiful mind.
</monologue>

<monologue>
When two souls are destined to be together, they are connected by an invisible thread. No matter the time, place or situation, this thread may stretch or tangle, but it will never break. If a man ever loses his loved one, he will search for her and everyone he meets. If you can't sleep at night, it's because you're awake in someone else's dreams. The sun and the moon yearn for each other, but time keeps them apart. So god painted the skies with eclipses, proving that even the most improbable love can unite. You are the face of who you loved most in your past life. When our eyes meet, the whole world falls silent and time stands still. Nothing else exists apart from you and me when our eyes meet. If you feel like you're losing everything, remember trees lose their leaves every year. Yet they still stand tall and wait for better days to come.
</monologue>

<monologue>
There are 10 powerful psychological truths. 1. Silence is more powerful than trying to prove a point. 2. When trust is broken, sorry means nothing. 3. Control your actions. Learn to react less. 4. When you are honest, you lose people who don't deserve you. 5. 1. Beautiful heart is worth more than 1,000 beautiful faces. 6. Small circle, private life, clear mind, happy heart. 7. Never go back to somebody who you left. 8. Stop overthinking. You can't control everything. Just let it be. 9. If somebody is stupid enough to walk away from you, be smart enough to let them go. 10. True friends are very rare. If you have one, you're very lucky.
</monologue>

<monologue>
I sat with my anger long enough until it told me it's real name was grief. I'm not a whole person and I don't think I will ever be. Parts of me died in the house I grew up in and I visit them in dreams. When you are not fed love on a silver spoon, you learn to lick it off knives. Your anger is the part of you that knows your mistreatment and abuse are unacceptable. Your anger knows you deserve to be treated well and with kindness. Anger is important. It needs to be expressed, acted out, and vocalized. When it doesn't, it begins to manifest to rage.
</monologue>

<monologue>
You know what your problem is? You're smart. Too smart. You overthink because your mind moves at a million miles a minute. You're sad because you're not fooled by the world like everyone else. You don't get along with most people because they just don't look at things the way you do. You think you're dumb because you're smart enough to know you don't know everything. Your problem is you're too smart. And happiness and intelligent people is one of the rarest things I know.
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
  const data = await apiFromCacheOr(
    "https://fakeurl.anthropic.com/anthropic.messages.create",
    body,
    async () => {
      const msg = await anthropic.messages.create(body);
      return msg;
    }
  );
  const msg = data.data;
  console.log("meta", data.meta);
  statsCounter.api_calls += 1;
  statsCounter.input_tokens += msg.usage.input_tokens;
  statsCounter.output_tokens += msg.usage.output_tokens;
  console.assert(msg.content.length === 1);
  if (!(msg.content[0].type === "text")) throw Error("unexpected message type");
  return msg.content[0].text;
}
